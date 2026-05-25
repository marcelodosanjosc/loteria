FROM python:3.11-slim

WORKDIR /app

# Instalar dependências básicas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código do backend
COPY . .

# Expor a porta que a API usará
EXPOSE 8000

# Executar a aplicação
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
