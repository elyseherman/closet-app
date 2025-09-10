from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)   # original file
    url = Column(String)                                 # storage link

    # Structured metadata
    category = Column(String, nullable=True)             # top, bottom, shoes...
    subcategory = Column(String, nullable=True)          # t-shirt, jeans, boots...
    color_base = Column(String, nullable=True)           # main color
    formality = Column(String, nullable=True)            # casual, formal...
    season = Column(String, nullable=True)               # comma-separated (e.g. "spring,summer")

    # Full JSON metadata
    labels_json = Column(String, nullable=True)            # store entire OpenAI JSON

    created_at = Column(DateTime, default=datetime.utcnow)
