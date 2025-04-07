from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Tuple
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import re
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from datetime import datetime

app = FastAPI(
    title="Moment Financial Transaction Classifier",
    description="API for financial transaction classification in Indonesian and English",
    version="1.0.0"
)

# Constants
MODEL_PATH = "transaction-classifier/model_artifacts/finance_model.h5"
TOKENIZER_PATH = "transaction-classifier/model_artifacts/tokenizer.pkl"
LABEL_MAPPINGS_PATH = "transaction-classifier/model_artifacts/label_mappings.pkl"
CONFIDENCE_THRESHOLD = 0.4  # Reduced threshold for better prediction acceptance

# Default categories by type
DEFAULT_CATEGORIES = {
    "income": "Other",
    "expense": "Other"  # Changed from Miscellaneous to Other
}

# Category type mapping
CATEGORY_TYPES = {
    # Income categories
    "Salary": "income",
    "Freelance": "income",
    "Investment": "income",
    "Gift": "income",
    "Refund": "income",
    "Bonus": "income",
    "Allowance": "income",
    "Holiday Bonus": "income",
    "Small Business": "income",
    "Rental": "income",
    "Dividend": "income",
    "Pension": "income",
    "Asset Sale": "income",
    "Inheritance": "income",
    "Other": "income",
    
    # Expense categories
    "Food & Dining": "expense",
    "Transportation": "expense",
    "Housing": "expense",
    "Utilities": "expense",
    "Internet & Phone": "expense",
    "Healthcare": "expense",
    "Entertainment": "expense",
    "Shopping": "expense",
    "Online Shopping": "expense",
    "Travel": "expense",
    "Education": "expense",
    "Children Education": "expense",
    "Debt Payment": "expense",
    "Charitable Giving": "expense",
    "Family Support": "expense",
    "Tax": "expense",
    "Insurance": "expense",
    "Subscriptions": "expense",
    "Personal Care": "expense",
    "Vehicle Maintenance": "expense",
    "Home Furnishing": "expense",
    "Clothing": "expense",
    "Electronics": "expense",
    "Hobbies": "expense",
    "Social Events": "expense",
    "Other": "expense"
}

# Keywords mapping to categories (for rule-based classification)
KEYWORD_MAPPINGS = {
    # Shopping keywords (Indonesia & English)
    "baju": "Clothing",
    "pakaian": "Clothing",
    "beli": "Shopping",       # General purchase intent
    "belanja": "Shopping",    # General purchase intent
    "tokopedia": "Online Shopping",
    "shopee": "Online Shopping",
    "lazada": "Online Shopping",
    "bukalapak": "Online Shopping",
    "blibli": "Online Shopping",
    "zalora": "Online Shopping",
    "sepatu": "Clothing",
    "tas": "Clothing",
    "celana": "Clothing",     # Added
    "kemeja": "Clothing",     # Added
    "jaket": "Clothing",      # Added
    "aksesoris": "Clothing",  # Added Accessories map to Clothing for simplicity
    "elektronik": "Electronics", # Added
    "gadget": "Electronics",   # Added
    "komputer": "Electronics", # Added
    "hp": "Electronics",       # Added (handphone)
    "smartphone": "Electronics",# Added
    "clothes": "Clothing",
    "outfit": "Clothing",
    "dress": "Clothing",
    "shoes": "Clothing",
    "bag": "Clothing",
    "pants": "Clothing",      # Added
    "shirt": "Clothing",      # Added
    "jacket": "Clothing",     # Added
    "accessories": "Clothing",# Added
    "electronics": "Electronics",#Added
    "computer": "Electronics", # Added
    "phone": "Electronics",    # Added
    "mall": "Shopping",       # General location
    "supermarket": "Shopping",# Added
    "pasar": "Shopping",      # Added (market)
    "toko": "Shopping",       # Added (shop)
    "warung": "Food & Dining",# Added (small food stall -> Food)
    "fashion": "Clothing",
    "lebaran": "Shopping",    # Contextual shopping
    "natal": "Shopping",      # Contextual shopping (Christmas)
    "diskon": "Shopping",     # Added (discount)
    "sale": "Shopping",       # Added
    "promo": "Shopping",      # Added
    "kasir": "Shopping",      # Added (cashier)
    "checkout": "Online Shopping", # Added

    # Food keywords
    "makan": "Food & Dining",
    "makanan": "Food & Dining",
    "minum": "Food & Dining",   # Added (drink)
    "minuman": "Food & Dining", # Added (drinks)
    "jajan": "Food & Dining",   # Added (snack)
    "cemilan": "Food & Dining", # Added (snack)
    "snack": "Food & Dining",   # Added
    "gorengan": "Food & Dining",# Added (fried snacks)
    "roti": "Food & Dining",    # Added (bread)
    "kue": "Food & Dining",     # Added (cake)
    "bakso": "Food & Dining",   # Added (meatball soup)
    "mie": "Food & Dining",     # Added (noodles)
    "nasi": "Food & Dining",    # Added (rice)
    "ayam": "Food & Dining",    # Added (chicken)
    "sapi": "Food & Dining",    # Added (beef)
    "ikan": "Food & Dining",    # Added (fish)
    "sayur": "Food & Dining",   # Added (vegetable)
    "buah": "Food & Dining",    # Added (fruit)
    "dapur": "Food & Dining",   # Added (kitchen -> related to groceries/cooking)
    "masak": "Food & Dining",   # Added (cook)
    "delivery": "Food & Dining",# Added
    "pesan": "Food & Dining",   # Added (order food)
    "order": "Food & Dining",   # Added
    "restoran": "Food & Dining",
    "restaurant": "Food & Dining",
    "rumah makan": "Food & Dining", # Added (eating house)
    "depot": "Food & Dining",   # Added
    "kantin": "Food & Dining",  # Added (canteen)
    "cafe": "Food & Dining",
    "kopi": "Food & Dining",
    "coffee": "Food & Dining",
    "teh": "Food & Dining",     # Added (tea)
    "susu": "Food & Dining",    # Added (milk)
    "jus": "Food & Dining",     # Added (juice)
    "gofood": "Food & Dining",
    "grabfood": "Food & Dining",
    "shopeefood": "Food & Dining", # Added
    "food": "Food & Dining",
    "drink": "Food & Dining",   # Added
    "grocery": "Food & Dining", # Added (map groceries to Food & Dining)
    "dinner": "Food & Dining",
    "lunch": "Food & Dining",
    "breakfast": "Food & Dining",
    "brunch": "Food & Dining",  # Added
    "dine": "Food & Dining",    # Added

    # Transportation keywords
    "bensin": "Transportation",
    "pertalite": "Transportation", # Added
    "pertamax": "Transportation",  # Added
    "solar": "Transportation",     # Added (diesel)
    "bbm": "Transportation",       # Added (fuel acronym)
    "gas": "Transportation",       # Ambiguous, but often fuel in context
    "isi": "Transportation",       # Added (fill up fuel/e-money)
    "top up": "Transportation",    # Added (often for e-money/toll)
    "e-money": "Transportation",   # Added
    "flazz": "Transportation",     # Added
    "brizzi": "Transportation",    # Added
    "toll": "Transportation",      # Added (tol)
    "tol": "Transportation",       # Added
    "parkir": "Transportation",
    "parking": "Transportation",
    "grab": "Transportation",
    "gojek": "Transportation",
    "gocar": "Transportation",     # Added
    "goride": "Transportation",    # Added
    "maxim": "Transportation",     # Added
    "indriver": "Transportation",  # Added
    "ojek": "Transportation",      # Added (motorcycle taxi)
    "online": "Transportation",    # Often refers to ojek/taxi online
    "taksi": "Transportation",
    "taxi": "Transportation",
    "angkot": "Transportation",    # Added (public minivan)
    "angkutan": "Transportation",  # Added (public transport)
    "umum": "Transportation",      # Added (public transport)
    "bus": "Transportation",       # Added
    "bis": "Transportation",       # Added (bus - alt spelling)
    "transjakarta": "Transportation", # Added
    "trans": "Transportation",     # Added (often prefix for transport)
    "mrt": "Transportation",       # Added
    "lrt": "Transportation",       # Added
    "krl": "Transportation",       # Added (commuter line)
    "commuter": "Transportation",  # Added
    "kereta": "Transportation",
    "train": "Transportation",
    "stasiun": "Transportation",   # Added (station)
    "bandara": "Travel",           # Added (airport -> Travel)
    "airport": "Travel",           # Added -> Travel
    "pesawat": "Travel",           # -> Travel
    "plane": "Travel",             # -> Travel
    "flight": "Travel",            # -> Travel
    "terbang": "Travel",           # Added (fly) -> Travel
    "kapal": "Travel",             # Added (ship) -> Travel
    "laut": "Travel",              # Added (sea) -> Travel
    "ferry": "Travel",             # Added -> Travel
    "pelabuhan": "Travel",         # Added (harbor) -> Travel
    "terminal": "Transportation",  # Added (bus/train terminal)
    "halte": "Transportation",     # Added (bus stop)
    "rental": "Transportation",    # Added (car/bike rental)
    "sewa": "Transportation",      # Added (rent - vehicle)
    "mobil": "Transportation",     # Added (car)
    "motor": "Transportation",     # Added (motorcycle)
    "kendaraan": "Transportation", # Added (vehicle)
    "transport": "Transportation",   # Added
    "transportasi": "Transportation",# Added
    "perjalanan": "Travel",        # Added (journey/trip) -> Travel
    "tiket": "Travel",             # -> Travel (usually for longer trips)
    "ticket": "Travel",            # -> Travel
    "booking": "Travel",           # Added -> Travel
    "hotel": "Travel",             # Added -> Travel
    "penginapan": "Travel",        # Added (lodging) -> Travel
    "losmen": "Travel",            # Added (inn) -> Travel
    "hostel": "Travel",            # Added -> Travel
    "villa": "Travel",             # Added -> Travel
    "airbnb": "Travel",            # Added -> Travel
    "travel": "Travel",            # Keep travel separate

    # Bills keywords
    "listrik": "Utilities",
    "electricity": "Utilities",
    "token": "Utilities",       # Added (prepaid electricity token)
    "pln": "Utilities",
    "air": "Utilities",
    "pdam": "Utilities",        # Added (regional water company)
    "water": "Utilities",
    "gas": "Utilities",         # Home gas
    "pgn": "Utilities",         # Added (state gas company)
    "internet": "Internet & Phone",
    "wifi": "Internet & Phone",
    "indihome": "Internet & Phone", # Added
    "biznet": "Internet & Phone",   # Added
    "myrepublic": "Internet & Phone",# Added
    "first media": "Internet & Phone",# Added
    "provider": "Internet & Phone",# Added
    "data": "Internet & Phone",   # Added (mobile data)
    "kuota": "Internet & Phone",  # Added (data quota)
    "paket": "Internet & Phone",  # Added (data package)
    "pulsa": "Internet & Phone",  # Added (phone credit)
    "telepon": "Internet & Phone",
    "telpon": "Internet & Phone", # Added (alt spelling)
    "seluler": "Internet & Phone",# Added (cellular)
    "pascabayar": "Internet & Phone",# Added (postpaid)
    "prabayar": "Internet & Phone", # Added (prepaid)
    "telkomsel": "Internet & Phone",# Added
    "xl": "Internet & Phone",     # Added
    "indosat": "Internet & Phone",# Added
    "smartfren": "Internet & Phone",# Added
    "three": "Internet & Phone",  # Added (3)
    "axis": "Internet & Phone",   # Added
    "phone": "Internet & Phone",
    "mobile": "Internet & Phone", # Added
    "bill": "Utilities",          # General term, map to Utilities
    "tagihan": "Utilities",       # General term, map to Utilities
    "bayar": "Debt Payment",      # Added (pay - often for bills/debt) -> Debt Payment
    "payment": "Debt Payment",    # -> Debt Payment
    "cicilan": "Debt Payment",    # Added (installment) -> Debt Payment
    "angsuran": "Debt Payment",   # Added (installment) -> Debt Payment
    "kredit": "Debt Payment",     # Added (credit/loan) -> Debt Payment
    "pinjaman": "Debt Payment",   # Added (loan) -> Debt Payment
    "loan": "Debt Payment",       # -> Debt Payment
    "hutang": "Debt Payment",     # Added (debt) -> Debt Payment
    "debt": "Debt Payment",       # -> Debt Payment
    "kartu kredit": "Debt Payment", # Added (credit card) -> Debt Payment
    "credit card": "Debt Payment",# -> Debt Payment
    "pajak": "Tax",             # Added -> Tax
    "tax": "Tax",               # -> Tax
    "ppn": "Tax",               # Added (VAT) -> Tax
    "pph": "Tax",               # Added (income tax) -> Tax
    "samsat": "Tax",            # Added (vehicle tax) -> Tax
    "asuransi": "Insurance",      # Added -> Insurance
    "insurance": "Insurance",     # -> Insurance
    "premi": "Insurance",         # Added (premium) -> Insurance
    "bpjs": "Insurance",          # Added (national health/social insurance) -> Insurance
    "jiwasraya": "Insurance",     # Added (example insurance company)
    "prudential": "Insurance",    # Added (example insurance company)
    "allianz": "Insurance",       # Added (example insurance company)
    "langganan": "Subscriptions", # -> Subscriptions
    "subscription": "Subscriptions",# -> Subscriptions
    "member": "Subscriptions",    # Added (membership fee) -> Subscriptions
    "membership": "Subscriptions",# -> Subscriptions
    "netflix": "Subscriptions",   # Added
    "spotify": "Subscriptions",   # Added
    "youtube": "Subscriptions",   # Added
    "disney": "Subscriptions",    # Added
    "hbo": "Subscriptions",       # Added
    "prime": "Subscriptions",     # Added (Amazon Prime)
    "gym": "Subscriptions",       # Added -> Subscriptions
    "fitnes": "Subscriptions",    # Added (fitness) -> Subscriptions
    "sewa": "Housing",            # Added (rent - housing) -> Housing
    "kontrakan": "Housing",       # Added (rented house) -> Housing
    "kos": "Housing",             # Added (boarding house room) -> Housing
    "kost": "Housing",            # Added (alt spelling) -> Housing
    "apartemen": "Housing",       # Added (apartment) -> Housing
    "rumah": "Housing",           # Added (house - could be rent/mortgage) -> Housing
    "kpr": "Housing",             # Added (mortgage) -> Housing
    "mortgage": "Housing",        # -> Housing
    "ipl": "Housing",             # Added (building management fee) -> Housing
    "maintenance": "Housing",     # Added (building/housing maintenance) -> Housing
    "kebersihan": "Housing",      # Added (cleaning fee) -> Housing
    "keamanan": "Housing",        # Added (security fee) -> Housing
    "sampah": "Housing",          # Added (waste disposal fee) -> Housing

    # Healthcare keywords
    "obat": "Healthcare",         # Added (medicine)
    "apotek": "Healthcare",       # Added (pharmacy)
    "apotik": "Healthcare",       # Added (alt spelling)
    "dokter": "Healthcare",       # Added (doctor)
    "doctor": "Healthcare",       # Added
    "klinik": "Healthcare",       # Added (clinic)
    "clinic": "Healthcare",       # Added
    "rumah sakit": "Healthcare",  # Added (hospital)
    "hospital": "Healthcare",     # Added
    "puskesmas": "Healthcare",    # Added (community health center)
    "periksa": "Healthcare",      # Added (check-up)
    "sakit": "Healthcare",        # Added (sick)
    "sehat": "Healthcare",        # Added (healthy)
    "health": "Healthcare",       # Added
    "medical": "Healthcare",      # Added
    "kacamata": "Healthcare",     # Added (glasses)
    "optik": "Healthcare",        # Added (optician)

    # Education keywords
    "sekolah": "Education",       # Added (school)
    "school": "Education",        # Added
    "kuliah": "Education",        # Added (university)
    "kampus": "Education",        # Added (campus)
    "universitas": "Education",   # Added (university)
    "university": "Education",    # Added
    "kursus": "Education",        # Added (course)
    "course": "Education",        # Added
    "les": "Education",           # Added (private lesson)
    "bimbel": "Education",        # Added (tutoring center)
    "tuition": "Education",       # Added
    "spp": "Education",           # Added (school fee)
    "uang pangkal": "Education",  # Added (admission fee)
    "buku": "Education",          # Added (book - often educational context)
    "book": "Education",          # Added
    "alat tulis": "Education",    # Added (stationery)
    "stationery": "Education",    # Added
    "wisuda": "Education",        # Added (graduation)
    "anak": "Children Education", # Added (child) -> Children Education
    "children": "Children Education", # -> Children Education

    # Personal Care keywords
    "salon": "Personal Care",     # Added
    "barber": "Personal Care",    # Added
    "pangkas rambut": "Personal Care",# Added (haircut)
    "cukur": "Personal Care",     # Added (shave)
    "spa": "Personal Care",       # Added
    "pijat": "Personal Care",     # Added (massage)
    "massage": "Personal Care",   # Added
    "kosmetik": "Personal Care",  # Added (cosmetics)
    "cosmetics": "Personal Care", # Added
    "makeup": "Personal Care",    # Added
    "skincare": "Personal Care",  # Added
    "parfum": "Personal Care",    # Added (perfume)
    "sabun": "Personal Care",     # Added (soap)
    "shampo": "Personal Care",    # Added (shampoo)
    "laundry": "Personal Care",   # Added (laundry service)

    # Entertainment keywords
    "bioskop": "Entertainment",   # Added (cinema)
    "cinema": "Entertainment",    # Added
    "film": "Entertainment",      # Added
    "movie": "Entertainment",     # Added
    "nonton": "Entertainment",    # Added (watch movie/show)
    "tiket": "Entertainment",     # Can be entertainment ticket
    "konser": "Entertainment",    # Added (concert)
    "concert": "Entertainment",   # Added
    "musik": "Entertainment",     # Added (music)
    "music": "Entertainment",     # Added
    "game": "Entertainment",      # Added
    "voucher": "Entertainment",   # Added (game/entertainment voucher)
    "hiburan": "Entertainment",   # Added (entertainment)
    "rekreasi": "Entertainment",  # Added (recreation)
    "tamasya": "Entertainment",   # Added (outing/sightseeing)
    "main": "Entertainment",      # Added (play - games/etc)
    "play": "Entertainment",      # Added
    "karaoke": "Entertainment",   # Added
    "museum": "Entertainment",    # Added
    "galeri": "Entertainment",    # Added (gallery)
    "pertunjukan": "Entertainment",# Added (show/performance)
    "teater": "Entertainment",    # Added (theater)

    # Other specific expenses
    "bengkel": "Vehicle Maintenance", # Added (workshop) -> Vehicle Maintenance
    "servis": "Vehicle Maintenance",  # Added (service) -> Vehicle Maintenance
    "service": "Vehicle Maintenance", # -> Vehicle Maintenance
    "montir": "Vehicle Maintenance",  # Added (mechanic) -> Vehicle Maintenance
    "oli": "Vehicle Maintenance",     # Added (oil) -> Vehicle Maintenance
    "ban": "Vehicle Maintenance",     # Added (tire) -> Vehicle Maintenance
    "spare part": "Vehicle Maintenance", # Added -> Vehicle Maintenance
    "aksesoris mobil": "Vehicle Maintenance", # Added -> Vehicle Maintenance
    "cuci mobil": "Vehicle Maintenance",# Added (car wash) -> Vehicle Maintenance
    "perbaikan": "Housing",          # Added (repair - often house) -> Housing (default, could be vehicle too)
    "renovasi": "Housing",           # Added (renovation) -> Housing
    "tukang": "Housing",             # Added (handyman) -> Housing
    "furnitur": "Home Furnishing",   # Added (furniture) -> Home Furnishing
    "furniture": "Home Furnishing",  # -> Home Furnishing
    "perabot": "Home Furnishing",    # Added (household items) -> Home Furnishing
    "alat rumah tangga": "Home Furnishing", # Added (household appliances) -> Home Furnishing
    "dekorasi": "Home Furnishing",   # Added (decoration) -> Home Furnishing
    "kado": "Gift",                 # Added (gift purchase) -> Treat as Expense Gift? Or map to Shopping/Other? Let's map to Gift (Expense)
    "hadiah": "Gift",               # Added (gift purchase) -> Gift (Expense)
    "gift": "Gift",                 # -> Gift (Expense) - Note: Need separate logic for income Gift
    "sumbangan": "Charitable Giving",# Added (donation) -> Charitable Giving
    "donasi": "Charitable Giving",   # Added (donation) -> Charitable Giving
    "zakat": "Charitable Giving",    # Added -> Charitable Giving
    "infaq": "Charitable Giving",    # Added -> Charitable Giving
    "sedekah": "Charitable Giving",  # Added -> Charitable Giving
    "amal": "Charitable Giving",     # Added (charity) -> Charitable Giving
    "charity": "Charitable Giving",  # -> Charitable Giving
    "keluarga": "Family Support",    # Added (family) -> Family Support
    "family": "Family Support",      # -> Family Support
    "orang tua": "Family Support",   # Added (parents) -> Family Support
    "anak": "Family Support",        # Can also be support -> Family Support (if not Education)
    "saudara": "Family Support",     # Added (sibling) -> Family Support
    "teman": "Social Events",        # Added (friend - often social spending) -> Social Events
    "traktir": "Social Events",      # Added (treat someone) -> Social Events
    "patungan": "Social Events",     # Added (chip in) -> Social Events
    "arisan": "Social Events",       # Added -> Social Events
    "nikah": "Social Events",        # Added (wedding gift/expense) -> Social Events
    "kondangan": "Social Events",    # Added (attend wedding) -> Social Events
    "ulang tahun": "Social Events",  # Added (birthday) -> Social Events
    "pesta": "Social Events",        # Added (party) -> Social Events
    "kumpul": "Social Events",       # Added (gathering) -> Social Events
    "liburan": "Travel",             # Added (holiday/vacation) -> Travel
    "hobi": "Hobbies",               # Added (hobby) -> Hobbies
    "kamera": "Hobbies",             # Added (camera - often hobby) -> Hobbies
    "buku": "Hobbies",               # Can be hobby -> Hobbies
    "tanaman": "Hobbies",            # Added (plants) -> Hobbies
    "hewan peliharaan": "Hobbies",   # Added (pet) -> Hobbies
    "pet": "Hobbies",                # -> Hobbies
    "alat pancing": "Hobbies",       # Added (fishing gear) -> Hobbies
    "olahraga": "Hobbies",           # Added (sports) -> Hobbies
    "sport": "Hobbies",              # -> Hobbies
    "musik": "Hobbies",              # Can be hobby -> Hobbies

    # Income keywords
    "gaji": "Salary",
    "salary": "Salary",
    "upah": "Salary",                # Added (wage)
    "pendapatan": "Salary",          # General income, map to Salary
    "penghasilan": "Salary",         # Added (earnings)
    "income": "Salary",              # General income, map to Salary
    "bonus": "Bonus",
    "thr": "Holiday Bonus",          # Added (Religious Holiday Bonus)
    "tunjangan": "Allowance",
    "allowance": "Allowance",
    "insentif": "Bonus",             # Added (incentive) -> Bonus
    "komisi": "Freelance",           # Added (commission) -> Freelance
    "fee": "Freelance",
    "honor": "Freelance",            # Added (honorarium) -> Freelance
    "freelance": "Freelance",        # Added
    "proyek": "Freelance",           # Added (project work) -> Freelance
    "project": "Freelance",          # -> Freelance
    "usaha": "Small Business",       # Added (business) -> Small Business
    "bisnis": "Small Business",      # Added (business) -> Small Business
    "toko": "Small Business",        # Can be income from shop -> Small Business
    "jualan": "Small Business",      # Added (selling) -> Small Business
    "laba": "Small Business",        # Added (profit) -> Small Business
    "profit": "Small Business",      # -> Small Business
    "omset": "Small Business",       # Added (revenue) -> Small Business
    "revenue": "Small Business",     # -> Small Business
    "sewa": "Rental",                # Income from rent -> Rental
    "kontrakan": "Rental",           # Income from rent -> Rental
    "kos": "Rental",                 # Income from rent -> Rental
    "investasi": "Investment",       # Added -> Investment
    "investment": "Investment",      # -> Investment
    "saham": "Investment",           # Added (stocks) -> Investment
    "reksadana": "Investment",       # Added (mutual funds) -> Investment
    "obligasi": "Investment",        # Added (bonds) -> Investment
    "dividen": "Dividend",           # Added -> Dividend
    "dividend": "Dividend",          # -> Dividend
    "bunga": "Investment",           # Added (interest) -> Investment
    "interest": "Investment",        # -> Investment
    "modal": "Investment",           # Added (capital gain) -> Investment
    "capital gain": "Investment",    # -> Investment
    "jual aset": "Asset Sale",       # Added -> Asset Sale
    "asset sale": "Asset Sale",      # -> Asset Sale
    "warisan": "Inheritance",        # Added -> Inheritance
    "inheritance": "Inheritance",    # -> Inheritance
    "pensiun": "Pension",            # Added -> Pension
    "pension": "Pension",            # -> Pension
    "hadiah": "Gift",                # Income gift -> Gift
    "gift": "Gift",                  # Income gift -> Gift
    "angpao": "Gift",                # Added (red envelope gift) -> Gift
    "transfer": "Other",             # Ambiguous - default to Other for keyword map
    "tarik tunai": "Other",          # Added (cash withdrawal) -> Other
    "setor tunai": "Other",          # Added (cash deposit) -> Other
    "refund": "Refund",              # -> Refund
    "reimburse": "Refund",           # Added -> Refund
    "klaim": "Refund",               # Added (claim, often insurance) -> Refund (or Insurance income?) Let's stick to Refund.
    "claim": "Refund"                # -> Refund
}

# Load model and resources
try:
    model = load_model(MODEL_PATH)
    with open(TOKENIZER_PATH, 'rb') as handle:
        tokenizer = pickle.load(handle)
    with open(LABEL_MAPPINGS_PATH, 'rb') as handle:
        label2id, id2label = pickle.load(handle)
except Exception as e:
    raise RuntimeError(f"Failed to load model resources: {str(e)}")

# Initialize stemmer
factory = StemmerFactory()
lemmatizer = factory.create_stemmer()

# Financial terms mapping (bilingual)
FINANCIAL_TERMS = {
    # Indonesian terms
    "gopay": "gopay", "ovo": "ovo", "dana": "dana", 
    "bca": "bca", "kpr": "kpr", "pln": "pln",
    "bibit": "investasi", "membership": "member",
    # English terms
    "payment": "payment", "transfer": "transfer",
    "salary": "salary", "bill": "bill",
    "shopping": "shopping", "food": "food"
}

# Request Models
class TransactionRequest(BaseModel):
    """Model for transaction classification request"""
    text: str = Field(..., description="Transaction description to be classified")
    type: str = Field(..., description="Transaction type (income/expense)")

class CategoryPrediction(BaseModel):
    """Model for individual category prediction"""
    category: str = Field(..., description="Category name")
    confidence: float = Field(..., description="Prediction confidence (0-1)")
    explanation: Optional[str] = Field(None, description="Explanation of why this category was chosen")

class PredictionResponse(BaseModel):
    """Model for classification response"""
    status: str = Field(..., description="Response status (success/error)")
    message: str = Field(..., description="Response message")
    data: Optional[dict] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.now)

class ErrorResponse(BaseModel):
    """Model for error response"""
    status: str = Field("error", description="Response status")
    message: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code")
    timestamp: datetime = Field(default_factory=datetime.now)

# Helper Functions
def preprocess_text(text: str) -> str:
    """Preprocess text for classification"""
    text = text.lower()
    # Keep certain characters that might be relevant in finance (e.g., %, -, / for dates)
    # Remove punctuation but keep essential symbols if needed, or handle them separately.
    # For now, basic removal:
    text = re.sub(r'[^\w\s]', '', text) # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip() # Normalize whitespace

    tokens = []
    # Use Sastrawi stemmer carefully - it can be aggressive
    # Consider skipping stemming for known entities/brands?
    for token in text.split():
        if token in FINANCIAL_TERMS: # Check known financial terms first
            tokens.append(FINANCIAL_TERMS[token])
        # Skip stemming for numbers? For now, we stem everything not in FINANCIAL_TERMS
        # elif token.isdigit():
        #     tokens.append(token)
        else:
            # Stemming can sometimes merge words undesirably (e.g., "beli makan" -> "beli makan")
            # Or change meaning ("belanja" -> "lanja"). Use with caution.
            try:
                stemmed = lemmatizer.stem(token)
                tokens.append(stemmed)
            except Exception: # Handle potential Sastrawi errors
                tokens.append(token) # Fallback to original token

    return ' '.join(tokens)

def apply_rule_based_classification(text: str, trans_type: str) -> Tuple[Optional[str], float, str]:
    """
    Apply rule-based classification prioritising direct keywords.
    Uses whole-word matching for patterns if no direct keyword is found.
    Returns (category, confidence, explanation) or (None, 0.0, "") if no rule applies.
    """
    original_words = text.lower().split() # Use original words for keyword matching first
    processed_text_for_match = preprocess_text(text) # Use processed for broader checks if needed
    processed_words = processed_text_for_match.split()

    # 1. Check Direct Keywords on Original Text (more reliable for brands/proper nouns)
    # Iterate backwards to potentially catch multi-word keywords first if structured that way (though KEYWORD_MAPPINGS is flat)
    # Or iterate normally is fine.
    matched_keywords = []
    for word in original_words:
        if word in KEYWORD_MAPPINGS:
            category = KEYWORD_MAPPINGS[word]
            # Check if the category's type matches the transaction type
            if CATEGORY_TYPES.get(category) == trans_type:
                # Give higher confidence to direct keyword matches
                # Return the first match found
                return category, 0.98, f"Category '{category}' chosen based on keyword '{word}'"
            # Store keyword even if type doesn't match, maybe useful later? For now, ignore.
            # else:
            #     matched_keywords.append((word, category))


    # 2. Check Direct Keywords on Processed Text (catches stemmed variations)
    # Avoid re-matching if already found above? No, this checks stemmed words.
    for word in processed_words:
        if word in KEYWORD_MAPPINGS:
            category = KEYWORD_MAPPINGS[word]
            if CATEGORY_TYPES.get(category) == trans_type:
                 # Slightly lower confidence than original word match
                return category, 0.95, f"Category '{category}' chosen based on processed keyword '{word}' (from '{text}')"


    # 3. Pattern Matching (Whole Words) - Lower priority, only if no direct keyword match
    # Use processed words for pattern matching for consistency with stemming
    word_set = set(processed_words) # Use set for efficient 'in' checks

    if trans_type == "expense":
        # General Shopping Intent (use specific keywords)
        shopping_intent_keywords = {"beli", "belanja", "bayar", "kasir", "order", "pesan", "purchase"}
        matched_shopping_intent = [w for w in shopping_intent_keywords if w in word_set]
        if matched_shopping_intent:
             # Check if a more specific category like Food/Clothing was NOT found via direct keywords
             # This requires knowing if step 1 or 2 returned something, but we wouldn't reach here if they did.
             # So, if we see 'beli' but no 'baju' or 'makan', it's likely general shopping.
            return "Shopping", 0.90, f"Category 'Shopping' chosen based on general purchase terms: {', '.join(matched_shopping_intent)}"

        # General Food Intent (check after direct food keywords)
        food_intent_keywords = {"makan", "minum", "jajan", "masak", "dapur", "dine", "delivery"}
        matched_food_intent = [w for w in food_intent_keywords if w in word_set]
        if matched_food_intent:
            return "Food & Dining", 0.90, f"Category 'Food & Dining' chosen based on general food terms: {', '.join(matched_food_intent)}"

        # General Transportation Intent (check after direct transport keywords)
        transport_intent_keywords = {"transport", "transportasi", "kendaraan", "perjalanan"} # 'perjalanan' might lean towards Travel
        matched_transport_intent = [w for w in transport_intent_keywords if w in word_set]
        if matched_transport_intent:
             # If 'perjalanan' is the only match, consider 'Travel'? For now, map to Transportation.
            return "Transportation", 0.90, f"Category 'Transportation' chosen based on general transport terms: {', '.join(matched_transport_intent)}"

        # General Travel Intent (check after direct travel keywords)
        travel_intent_keywords = {"travel", "liburan", "wisata", "tur", "tour", "trip", "holiday", "vacation", "jalan"} # jalan-jalan
        matched_travel_intent = [w for w in travel_intent_keywords if w in word_set]
        if matched_travel_intent:
            return "Travel", 0.90, f"Category 'Travel' chosen based on general travel terms: {', '.join(matched_travel_intent)}"

    # No rule match found
    return None, 0.0, ""

def filter_categories_by_type(probabilities: np.ndarray, transaction_type: str) -> List[Tuple[str, float]]:
    """Filter categories by transaction type and sort by confidence"""
    filtered_categories = []
    
    for idx, prob in enumerate(probabilities):
        category = id2label[idx]
        # Check if category exists in our mapping and matches the transaction type
        if category in CATEGORY_TYPES and CATEGORY_TYPES[category] == transaction_type:
            filtered_categories.append((category, float(prob)))
    
    # Sort by confidence (highest first)
    return sorted(filtered_categories, key=lambda x: x[1], reverse=True)

def generate_explanation(category: str, processed_text: str, trans_type: str) -> str:
    """Generate more specific explanation based on context"""
    # Add more specific explanations based on category patterns
    if "belanja" in processed_text or "shopping" in processed_text or "beli" in processed_text:
        return f"Category '{category}' was chosen because the description contains shopping-related terms"
    elif "makan" in processed_text or "food" in processed_text:
        return f"Category '{category}' was chosen because the description contains food-related terms"
    elif "transport" in processed_text or "gojek" in processed_text or "grab" in processed_text:
        return f"Category '{category}' was chosen because the description contains transportation-related terms"
    elif "gaji" in processed_text or "salary" in processed_text:
        return f"Category '{category}' was chosen because the description contains income-related terms"
    elif category == DEFAULT_CATEGORIES.get(trans_type):
        return f"Default category '{category}' was chosen because no high-confidence prediction was available"
    else:
        return f"Category '{category}' was chosen based on the transaction description and type"

# API Endpoints
@app.post(
    "/api/v1/classify",
    response_model=PredictionResponse,
    responses={
        200: {"model": PredictionResponse},
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def classify_transaction(request: TransactionRequest):
    """
    Classify financial transaction
    
    - **text**: Transaction description
    - **type**: Transaction type (income/expense)
    """
    try:
        # Validate transaction type
        if request.type not in ["income", "expense"]:
            raise ValueError(f"Invalid transaction type: {request.type}. Must be 'income' or 'expense'")

        # Apply rule-based classification FIRST
        rule_category, rule_confidence, rule_explanation = apply_rule_based_classification(request.text, request.type)

        # If a high-confidence rule match is found, return it immediately
        if rule_category and rule_confidence >= 0.90: # Use a threshold for rule confidence
            return PredictionResponse(
                status="success",
                message="Transaction classified using rule-based matching",
                data={
                    "category": rule_category,
                    "confidence": rule_confidence,
                    "processed_text": preprocess_text(request.text), # Include processed text
                    "explanation": rule_explanation,
                    "suggestions": [] # No suggestions needed for high-confidence rule match
                }
            )

        # --- Proceed with ML classification if no strong rule match ---

        # Preprocess text for ML model (might differ slightly from rule preprocessing if needed)
        processed_text_ml = preprocess_text(request.text) # Reuse preprocess function for now
        context_text = f"{processed_text_ml} [type:{request.type}]" # Add type context for ML

        # Get ML prediction
        seq = tokenizer.texts_to_sequences([context_text])
        # Ensure maxlen matches the model's expected input shape
        maxlen = model.input_shape[1]
        if maxlen is None: # Handle models with variable input length if necessary
             # Find max length from tokenizer or set a reasonable default
             # maxlen = max(len(s) for s in seq) # This wouldn't work without training data info
             maxlen = 50 # Example default if shape[1] is None
        padded = pad_sequences(seq, maxlen=maxlen, padding='post')
        proba = model.predict(padded, verbose=0)[0]

        # Filter ML categories by transaction type
        filtered_ml_categories = filter_categories_by_type(proba, request.type)

        # Handle case where ML yields no valid categories for the type
        if not filtered_ml_categories:
            default_category = DEFAULT_CATEGORIES[request.type]
            # If rule-based *did* find something (even low confidence), maybe use that instead of default?
            if rule_category: # Use the lower confidence rule category if ML failed
                 return PredictionResponse(
                    status="success",
                    message="Using rule-based category as ML fallback",
                    data={
                        "category": rule_category,
                        "confidence": rule_confidence if rule_confidence > 0 else 0.1, # Assign minimal confidence
                        "processed_text": processed_text_ml,
                        "explanation": f"{rule_explanation} (ML prediction failed for type '{request.type}')",
                        "suggestions": []
                    }
                 )
            else: # Otherwise, use the hardcoded default
                return PredictionResponse(
                    status="success",
                    message="Using default category as no ML results matched type",
                    data={
                        "category": default_category,
                        "confidence": 0.1, # Low confidence for default fallback
                        "processed_text": processed_text_ml,
                        "explanation": f"Default category '{default_category}' chosen because no ML predictions matched transaction type: {request.type}",
                        "suggestions": []
                    }
                )

        # Get best ML category and confidence
        best_ml_category, best_ml_confidence = filtered_ml_categories[0]

        # --- Combine Rule and ML results ---
        # If rule-based found a category (even low confidence), potentially use it or boost ML result

        final_category = best_ml_category
        final_confidence = best_ml_confidence
        final_explanation = generate_explanation(best_ml_category, processed_text_ml, request.type) # Default ML explanation

        if rule_category:
            # If rule category is the same as best ML category, boost confidence and use rule explanation
            if rule_category == best_ml_category:
                final_confidence = max(best_ml_confidence, rule_confidence) # Take the higher confidence
                final_explanation = rule_explanation # Prefer rule explanation for clarity
            else:
                # If rule category is different but appears in top N ML suggestions, consider boosting it?
                # Or, if rule confidence was decent (>0.5?), maybe prefer it over a low-confidence ML prediction?
                # Let's keep it simple: ML prediction takes precedence unless rule confidence was very high (handled earlier).
                # We can add the rule category to suggestions if it's different.
                pass # Stick with ML result for now if different


        # --- Handle Low Confidence ML Prediction ---
        if final_confidence < CONFIDENCE_THRESHOLD:
            default_category = DEFAULT_CATEGORIES[request.type]

            # Prepare suggestions from ML results
            ml_suggestions = [
                {"category": cat, "confidence": conf}
                for cat, conf in filtered_ml_categories[:3] # Top 3 ML suggestions
            ]

            # Add rule category to suggestions if it's different and not already there
            if rule_category and rule_category != final_category and rule_category != default_category:
                 # Check if already in suggestions
                 if not any(s['category'] == rule_category for s in ml_suggestions):
                     ml_suggestions.insert(0, {"category": rule_category, "confidence": rule_confidence}) # Add rule suggestion at the start

            return PredictionResponse(
                status="success",
                message="Low confidence prediction, using default category",
                data={
                    "category": default_category,
                    "confidence": final_confidence, # Report the original low ML confidence
                    "processed_text": processed_text_ml,
                    "explanation": f"Default category '{default_category}' chosen because confidence ({final_confidence:.2f}) was below threshold ({CONFIDENCE_THRESHOLD}). ML suggested '{final_category}'. {rule_explanation if rule_category and rule_category != final_category else ''}",
                    "suggestions": ml_suggestions[:3] # Limit suggestions
                }
            )

        # --- High Confidence ML Prediction ---
        else:
             # Prepare suggestions (excluding the best prediction)
            suggestions = [
                {"category": cat, "confidence": conf}
                for cat, conf in filtered_ml_categories[1:4] # Next 3 best ML predictions
            ]
            # Add rule category to suggestions if different and not already included
            if rule_category and rule_category != final_category:
                 if not any(s['category'] == rule_category for s in suggestions):
                     suggestions.insert(0, {"category": rule_category, "confidence": rule_confidence})

            return PredictionResponse(
                status="success",
                message="Transaction successfully classified",
                data={
                    "category": final_category,
                    "confidence": final_confidence,
                    "processed_text": processed_text_ml,
                    "explanation": final_explanation,
                    "suggestions": suggestions[:3] # Limit suggestions
                }
            )

    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": str(ve),
                "error_code": "VALIDATION_ERROR"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Failed to classify transaction: {str(e)}",
                "error_code": "CLASSIFICATION_ERROR"
            }
        )

@app.get("/api/v1/health")
async def health_check():
    """Endpoint to check service status"""
    return {
        "status": "success",
        "message": "Service is running properly",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }
