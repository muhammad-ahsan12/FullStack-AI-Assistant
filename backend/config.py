from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_community.tools import WikipediaQueryRun, DuckDuckGoSearchResults
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import InMemorySaver
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# API keys should be set in .env file
if not os.getenv('GOOGLE_API_KEY') or not os.getenv('GROQ_API_KEY'):
    raise ValueError("Missing required environment variables. Please check your .env file.")

# -------------------------------
# Models
# -------------------------------
# google_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)
text_model = ChatGroq(model="llama-3.3-70b-versatile")
vision_model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.6)

# -------------------------------
# Tools
# -------------------------------
wikipedia = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())
search = DuckDuckGoSearchResults()
tools = [search, wikipedia]

# -------------------------------
# Memory Saver
# -------------------------------
checkpointer = InMemorySaver()
