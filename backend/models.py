from pydantic import BaseModel

# -------------------------------
# Pydantic Models for Request Validation
# -------------------------------
class ChatRequest(BaseModel):
    message: str
    thread_id: str = None

class VisionRequest(BaseModel):
    question: str
    image_url: str
    thread_id: str = None

class PDFRequest(BaseModel):
    query: str
    thread_id: str = None