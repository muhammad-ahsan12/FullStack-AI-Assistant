from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from models import ChatRequest, VisionRequest, PDFRequest
from langchain_core.messages import HumanMessage, SystemMessage
from graphs import graph
import uuid
import logging
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="AI Assistant Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# FastAPI Endpoints
# -------------------------------
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint for text-based chat interactions.
    """
    try:
        thread_id = request.thread_id or str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}

        result = graph.invoke({
            "messages": [HumanMessage(content=request.message)]
        }, config=config)

        return JSONResponse({
            "response": result["messages"][-1].content,
            "thread_id": thread_id
        })
    except Exception as e:
        logger.error(f"Error in chat_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vision")
async def vision_endpoint(request: VisionRequest):
    """
    Endpoint for vision-based queries with an image URL.
    """
    try:
        thread_id = request.thread_id or str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}

        vision_result = graph.invoke({
            "messages": [
                HumanMessage(content=[
                    {"type": "text", "text": request.question},
                    {"type": "image_url", "image_url": request.image_url}
                ])
            ]
        }, config=config)

        return JSONResponse({
            "response": vision_result["messages"][-1].content,
            "thread_id": thread_id
        })
    except Exception as e:
        logger.error(f"Error in vision_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf")
async def pdf_endpoint(query: str = None, file: UploadFile = File(...), thread_id: str = None):
    """
    Endpoint for PDF processing and querying.
    """
    try:
        # Read PDF content into memory
        pdf_content = await file.read()

        thread_id = thread_id or str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}

        pdf_result = graph.invoke({
            "messages": [
                HumanMessage(content=[
                    {"type": "pdf", "pdf_content": pdf_content},  # Pass content instead of path
                    {"type": "text", "text": query or "Summarize the PDF."}
                ])
            ]
        }, config=config)

        return JSONResponse({
            "response": pdf_result["messages"][-1].content,
            "thread_id": thread_id
        })
    except Exception as e:
        logger.error(f"Error in pdf_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import Body

@app.post("/generate-image")
async def generate_image_endpoint(
    prompt: str = Body(..., embed=True),
    width: int = Body(1024),
    height: int = Body(1024),
    seed: int = Body(42),
    model: str = Body("flux"),
    thread_id: str = None
):
    """
    Endpoint for AI image generation.
    """
    try:
        thread_id = thread_id or str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}

        image_result = graph.invoke({
            "messages": [
                HumanMessage(content=[
                    {"type": "text", "text": f"generate image: {prompt}"},
                ])
            ]
        }, config=config)

        # Pull URL from result
        generated_url = image_result.get("generated_image_url", "")

        return JSONResponse({
            "response": image_result["messages"][-1].content,
            "generated_image_url": generated_url,
            "thread_id": thread_id
        })
    except Exception as e:
        logger.error(f"Error in generate_image_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return JSONResponse({"status": "healthy"})