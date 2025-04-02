# Setup API Klasifikasi Teks

Ikuti instruksi terlebih dahulu untuk menjalankan API

## 1. URL Semua API
### ```http://127.0.0.1:8000/transaction-classifier```
Request Body:
```
{
  "text": ""
}
```
Response:
```
{
  "category": "",
  "confidence": 0,
  "processed_text": ""
}
```

## 2. Buat Virtual Environment

### **Windows**
```sh
python -m venv venv
venv\Scripts\activate
```

### **macOS/Linux**
```sh
python3 -m venv venv
source venv/bin/activate
```

## 3. Install Dependencies

Setelah membuat dan aktivasi virtual environment silakan install library library dari `requirements.txt`.

```sh
pip install -r requirements.txt
```

## 4. Jalankan API

Untuk menjalankan API nya harus menggunakan **Uvicorn**:

```sh
uvicorn moment-fastapi-app:app --host 0.0.0.0 --port 8000 --reload
```

## 5. Tes API Dengan Swagger UI
Buka browser, ketik **http://127.0.0.1:8000/docs** untuk akses API nya secara langsung.

## 6. Matikan Virtual Environment

Habis selesai menggunakan atau berhenti menjalankan API nya, virtual environment nya langsung dimatikan.

```sh
deactivate
```

