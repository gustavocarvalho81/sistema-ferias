from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime, timedelta
from io import BytesIO
from typing import Optional
import json

app = FastAPI(title="Sistema de Gestão de Férias")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def processar_dados(df_clientes, df_ferias, dias_alerta: int = 60):
    """Processa os dados das planilhas e retorna férias próximas ao vencimento"""
    try:
        # Cria dicionário de clientes
        clientes = dict(zip(df_clientes['I_CLIENTE'], df_clientes['NOME']))
        
        # Calcula datas limite
        data_atual = datetime.now()
        data_limite = data_atual + timedelta(days=dias_alerta)
        
        # Converte e filtra datas
        df_ferias['LIMITE_PARA_GOZO'] = pd.to_datetime(df_ferias['LIMITE_PARA_GOZO'])
        ferias_proximas = df_ferias[
            (df_ferias['LIMITE_PARA_GOZO'] >= data_atual) & 
            (df_ferias['LIMITE_PARA_GOZO'] <= data_limite)
        ].copy()
        
        # Adiciona informações complementares
        ferias_proximas['EMPRESA'] = ferias_proximas['I_CLIENTE'].map(clientes)
        ferias_proximas['DIAS_RESTANTES'] = ferias_proximas['DIAS_DIREITO'] - ferias_proximas['DIAS_GOZADOS']
        
        # Prepara o resultado
        resultado = ferias_proximas.sort_values(['LIMITE_PARA_GOZO', 'I_CLIENTE'])
        
        # Converte para formato JSON compatível
        resultado['LIMITE_PARA_GOZO'] = resultado['LIMITE_PARA_GOZO'].dt.strftime('%Y-%m-%d')
        
        return {
            'dados': json.loads(resultado.to_json(orient='records')),
            'metricas': {
                'total_alertas': len(resultado),
                'empresas_afetadas': resultado['EMPRESA'].nunique(),
                'media_dias_restantes': round(resultado['DIAS_RESTANTES'].mean(), 1)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analisar-ferias/")
async def analisar_ferias(
    arquivo: UploadFile = File(...),
    dias_alerta: Optional[int] = 60
):
    """Endpoint para analisar arquivo Excel de férias"""
    try:
        # Lê o arquivo Excel
        conteudo = await arquivo.read()
        
        # Carrega as planilhas
        excel_file = BytesIO(conteudo)
        df_clientes = pd.read_excel(excel_file, sheet_name='HRVCLIENTE')
        excel_file.seek(0)  # Retorna ao início do arquivo
        df_ferias = pd.read_excel(excel_file, sheet_name='FOFERIAS_AQUISITIVOS')
        
        # Processa os dados
        return processar_dados(df_clientes, df_ferias, dias_alerta)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Para desenvolvimento local
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)