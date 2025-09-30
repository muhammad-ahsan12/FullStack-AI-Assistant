from langchain_community.utilities import GoogleSerperAPIWrapper
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import InMemorySaver
from typing import Annotated, List, Dict, Any
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_community.tools import WikipediaQueryRun, DuckDuckGoSearchResults
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_community.utilities import WikipediaAPIWrapper
import io
import PyPDF2
from config import text_model, vision_model, wikipedia, search, tools, checkpointer
import requests
from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

# -------------------------------
# State Definition
# -------------------------------
class State(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    image_url: str                 # for Vision node
    generated_image_url: str       # for Image Generation node
    image_prompt: str   

workflow = StateGraph(State)

# -------------------------------
# Router Node
# -------------------------------

# ✅ Define schema
# ✅ Define schema
class RouterDecision(BaseModel):
    route: Literal["chatbot", "vision", "pdf", "image_generation"] = Field(
        ..., description="Node to handle the request."
    )
    reasoning: str = Field(
        ..., description="Short explanation of why this node was chosen."
    )

# ✅ Wrap your model with structured output
structured_router_llm = text_model.with_structured_output(RouterDecision)

# ✅ Fixed Router function
def router_node(state: State) -> str:
    """
    Smart router that correctly identifies simple conversations vs special tasks.
    """
    last_msg = state["messages"][-1]
    
    has_image = False
    has_pdf = False
    user_text = ""
    
    # Extract content and detect attachments
    if isinstance(last_msg.content, str):
        user_text = last_msg.content
    elif isinstance(last_msg.content, list):
        text_parts = []
        for c in last_msg.content:
            if isinstance(c, dict):
                if "text" in c:
                    text_parts.append(c["text"])
                elif "image_url" in c or c.get("type") == "image":
                    text_parts.append("[IMAGE_ATTACHED]")
                    has_image = True
                elif c.get("type") == "pdf" or "pdf_content" in c:
                    text_parts.append("[PDF_ATTACHED]")
                    has_pdf = True
        user_text = " ".join(text_parts)
    else:
        user_text = str(last_msg.content)
    
    # Build recent conversation context (last 3 messages for efficiency)
    conversation_history = ""
    if len(state["messages"]) > 1:
        recent_msgs = state["messages"][-4:-1]  # Exclude current message
        history_parts = []
        for msg in recent_msgs:
            role = "User" if isinstance(msg, HumanMessage) else "Assistant"
            content = msg.content if isinstance(msg.content, str) else str(msg.content)[:100]
            history_parts.append(f"{role}: {content}")
        conversation_history = "\n".join(history_parts)
    
    # Enhanced routing prompt with clear priorities
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a routing assistant. Analyze the user's message and decide which node should handle it.\n\n"
         "**IMPORTANT PRIORITIES:**\n"
         "1. If [IMAGE_ATTACHED] is present → route to 'vision'\n"
         "2. If [PDF_ATTACHED] is present → route to 'pdf'\n"
         "3. If user wants to CREATE/GENERATE/DRAW an image → route to 'image_generation'\n"
         "4. For ALL other cases (greetings, questions, chat, info requests) → route to 'chatbot'\n\n"
         "**Node Descriptions:**\n"
         "- 'chatbot': General conversation, Q&A, greetings, explanations, search queries\n"
         "- 'vision': Analyze uploaded images (ONLY if [IMAGE_ATTACHED] present)\n"
         "- 'pdf': Analyze uploaded PDFs (ONLY if [PDF_ATTACHED] present)\n"
         "- 'image_generation': Generate new images from text (keywords: generate, create, draw, make image)\n\n"
         "**Examples:**\n"
         "- 'Hello' → chatbot\n"
         "- 'What is Python?' → chatbot\n"
         "- 'Search for latest news' → chatbot\n"
         "- 'Explain quantum physics' → chatbot\n"
         "- 'Generate an image of a sunset' → image_generation\n"
         "- 'What's in this image? [IMAGE_ATTACHED]' → vision\n"
         "- 'Summarize this [PDF_ATTACHED]' → pdf\n\n"
         "Default to 'chatbot' unless there's a clear reason for another node."
        ),
        ("user",
         "**Recent Conversation:**\n{history}\n\n"
         "**Current Message:**\n{message}\n\n"
         "Which node should handle this?"
        )
    ])
    
    try:
        decision: RouterDecision = (prompt | structured_router_llm).invoke({
            "history": conversation_history if conversation_history else "No previous messages",
            "message": user_text
        })
        
        # Validation: Force correct routing based on attachments
        if has_image and decision.route != "vision":
            print(f"⚠️ Correcting route: Image attached, forcing vision node")
            decision.route = "vision"
        elif has_pdf and decision.route != "pdf":
            print(f"⚠️ Correcting route: PDF attached, forcing pdf node")
            decision.route = "pdf"
        
        print(f"🔀 Routing to: {decision.route}")
        print(f"💭 Reason: {decision.reasoning}")
        
        return decision.route
        
    except Exception as e:
        print(f"⚠️ Router error: {e}")
        print(f"📝 User text was: {user_text[:100]}")
        
        # Smart fallback based on attachments
        if has_image:
            print("Fallback: Image detected, routing to vision")
            return "vision"
        elif has_pdf:
            print("Fallback: PDF detected, routing to pdf")
            return "pdf"
        else:
            print("Fallback: Routing to chatbot")
            return "chatbot"
# -------------------------------
# Chat Node
# -------------------------------
def chat_node(state: State):
    system_prompt = SystemMessage(content=(
        "You are **Bob 🤖**, the user’s friendly, helpfulassistant.\n\n"
        "- Always warm, approachable, and polite — greet the user with friendliness.\n"
        "- Be concise but engaging, avoid robotic tone.\n"
        "- Always remember past messages in this session and keep context.\n"
        "- If the user greets you ('hi', 'hello', 'salam', etc.), reply warmly and ask how you can help.\n"
        "- Use a tool is used (Wikipedia, DuckDuckGo, etc.), mention it naturally and conversationally \n"
       "- Use persuasive but friendly language (avoid sounding pushy).\n"
        "- Always provide responses in a **user-friendly and engaging way**.\n"
        "- Keep answers clear, well-structured, and tailored to the query.\n"
    ))

    messages = [system_prompt] + state["messages"]
    response = text_model.invoke(messages)

    return {"messages": state["messages"] + [response]}


# -------------------------------
# Vision Node
# -------------------------------
def vision_node(state: State):
    last_msg = state["messages"][-1]

    question, image_url = None, None
    for c in last_msg.content:
        if c.get("type") == "text":
            question = c["text"]
        elif c.get("type") == "image_url":
            image_url = c["image_url"]

    if not image_url:
        image_url = state.get("image_url", "")

    system_prompt = SystemMessage(content=(
        "You are a **Professional Image Analyst 🖼️**.\n"
        "Your task is to carefully examine the provided image and give a response that is:\n\n"
        "Analyze visible objects, people, text, environment, and context.\n"
        "Always prioritize answering the user’s question directly.\n"
        "If the question is about an object, explain its features.\n"
        "If about context, describe relationships and scene.\n"
        "Keep the explanation natural, not robotic.\n\n"
        "If the user provides no question, describe the image in detail, including:\n"
        "- Main subjects (objects, people, animals)\n"
        "- Surroundings & background\n"
        "- Colors, style, emotions, or overall context."
        "- always give the consize response."
    ))

    vision_message = HumanMessage(content=[
        {"type": "text", "text": question or "Please describe this image in detail."},
        {"type": "image_url", "image_url": image_url}
    ])

    response = vision_model.invoke([system_prompt, vision_message])

    return {"messages": state["messages"] + [response]}


# -------------------------------
# PDF Query Node
# -------------------------------
import io

def pdf_query_node(state: State):
    last_msg = state["messages"][-1]

    pdf_content, query = None, None
    for c in last_msg.content:
        if c.get("type") == "pdf":
            pdf_content = c.get("pdf_content")  # PDF passed as bytes
        elif c.get("type") == "text":
            query = c["text"]

    if not pdf_content:
        return {"messages": state["messages"] + [
            SystemMessage(content="⚠️ No PDF content provided. Please upload a valid PDF file.")
        ]}

    extracted_text = ""
    try:
        pdf_file = io.BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            extracted_text += page.extract_text() or ""
    except Exception as e:
        extracted_text = f"⚠️ Error reading PDF: {str(e)}"

    # ✅ Enhanced System Prompt
    system_prompt = SystemMessage(content=(
        "You are a **Smart PDF Assistant 📄**.\n"
        "Your job is to carefully read the extracted PDF text and provide responses that are:\n\n"
        "1.Always directly address the user's query.\n"
        "2.Use bullet points, short paragraphs, or numbered lists.\n"
        "3.Highlight key points, main ideas, and important details.\n"
        "4.Explain in a natural, friendly, and professional tone.\n\n"
        "If the PDF is very long:\n"
        "- Summarize only the **most relevant sections** based on the user query.\n"
        "- Avoid repeating unnecessary details.\n\n"
        "If the user doesn’t provide a query, give a concise **summary of the whole PDF**."
    ))

    # Build the PDF query message
    pdf_message = HumanMessage(content=f"""
📄 **Extracted PDF Content** (truncated for analysis):
{extracted_text[:4000]}

❓ **User Query**: {query or "Summarize the PDF in detail."}
""")

    response = text_model.invoke([system_prompt, pdf_message])

    return {"messages": state["messages"] + [response]}



import urllib.parse
from langchain_core.messages import AIMessage

def image_generation_node(state: State):
    """
    Generate an image from a text prompt using Pollinations API.
    """
    last_msg = state["messages"][-1]

    # Default values
    prompt, width, height, seed, model = "A random artwork", 512, 512, 42, "flux"

    # ✅ Accept both plain text and structured list
    if isinstance(last_msg.content, str):
        prompt = last_msg.content
    elif isinstance(last_msg.content, list):
        for c in last_msg.content:
            if isinstance(c, dict) and c.get("type") == "text":
                prompt = c.get("text", prompt)

    # ✅ URL-encode the prompt for safety
    encoded_prompt = urllib.parse.quote_plus(prompt)

    # Pollinations API URL
    image_url = f"https://pollinations.ai/p/{encoded_prompt}?width={width}&height={height}&seed={seed}&model={model}"

    try:
        # Optional: download locally (can be removed if not needed)
        response = requests.get(image_url, timeout=10)
        with open("generated_image.jpg", "wb") as f:
            f.write(response.content)
        print("✅ Image Downloaded")
    except Exception as e:
        return {
            "messages": state["messages"] + [
                AIMessage(content=f"⚠️ Image generation failed: {str(e)}")
            ]
        }

    return {
        "messages": state["messages"] + [
            AIMessage(content=f"🖼️ Here’s your image for **'{prompt}'**:\n{image_url}")
        ],
        "generated_image_url": image_url,
        "image_prompt": prompt
    }

# -------------------------------
# Graph Construction
# -------------------------------
workflow.add_node("chatbot", chat_node)
workflow.add_node("vision", vision_node)
workflow.add_node("tools", ToolNode(tools))
workflow.add_node("pdf", pdf_query_node)
workflow.add_node("image_generation", image_generation_node)  # ✅ new node

# Conditional routing from START
workflow.add_conditional_edges(START, router_node, {
    "chatbot": "chatbot",
    "vision": "vision",
    "pdf": "pdf",
    "image_generation": "image_generation"  # ✅ added routing
})

# Tools loop back to chatbot
workflow.add_conditional_edges("chatbot", tools_condition)
workflow.add_edge("tools", "chatbot")

# Endpoints
workflow.add_edge("vision", END)
workflow.add_edge("chatbot", END)
workflow.add_edge("pdf", END)
workflow.add_edge("image_generation", END)  # ✅ new edge

# Compile graph with checkpointer
graph = workflow.compile(checkpointer=checkpointer)