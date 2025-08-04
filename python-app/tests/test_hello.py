from app import app

def test_hello():
    client = app.test_client()
    response = client.get("/hello")
    assert response.status_code == 200
    assert response.data.decode("utf-8") == "Hello from Python App!"
