# Machine Learning API Documentation

## 1. Endpoint URLs
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

## 2. How To Setup A Virtual Environment
Virtual environments are important in python to help prevent conflicts between libraries and tools.

### **Windows**
```sh
python -m venv venv  # cmd for creating the virtual environment
venv\Scripts\activate  # cmd for activating it
```

### **macOS/Linux**
```sh
python3 -m venv venv  # cmd for creating the virtual environment
source venv/bin/activate  # cmd for activating it
```

## 3. Dependencies
There's a bunch of libs you might want to install before you can run this API.
You can just run this command to download all the necessary libs. `requieremnts.txt` is just a text file that contains all the library names.
```sh
pip install -r requirements.txt
```

## 4. How To Run The API
You have to use `uvicorn` to run the API.

```sh
uvicorn moment-fastapi-app:app --host 0.0.0.0 --port 8000 --reload
```

## 5. API Testing
After you run the API, visit **http://127.0.0.1:8000/docs** on your browser to have direct access to all endpoints.

## 6. Deactivate The Virtual Environment
After you're done with your shenanigans it's best to deactivate your virtual environment.<br>
*REMEMBER,* don't deactivate your venv if you still want to run the app or install any other tools.<br>
If you wanna run the API again be sure to activate your venv (Virtual Environment) first.<br>
Instructions on how to activate your venv can be viewed [here](#2-how-to-setup-a-virtual-environment).<br>
Running the API without activating your venv will result in unexpected behaviour.<br>
I'm tired of having to explain these things to non-python devs. Just follow my instruction and you'll be fine.<br>

```sh
deactivate  # this is the cmd to deactivate any venv
```

