import React, { useState } from 'react';
import { AlertTriangle, Building2, Calendar, Upload } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dias, setDias] = useState(60);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('dias_alerta', dias);

    try {
      const response = await fetch('https://sistema-ferias.onrender.com/analisar-ferias/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao processar arquivo');
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Sistema de Gestão de Férias</h1>
        <p className="text-gray-600">Análise e controle de férias dos funcionários</p>
      </div>

      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm">Período de alerta (dias):</label>
            <select 
              value={dias} 
              onChange={(e) => setDias(Number(e.target.value))}
              className="p-2 border rounded"
            >
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
          
          <label className="flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 w-full">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              {loading ? 'Processando...' : 'Clique para upload da planilha'}
            </span>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Total de Alertas</h3>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold">{data.metricas.total_alertas}</div>
              <p className="text-xs text-gray-500">nos próximos {dias} dias</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Empresas Afetadas</h3>
                <Building2 className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{data.metricas.empresas_afetadas}</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Média de Dias Restantes</h3>
                <Calendar className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{data.metricas.media_dias_restantes}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Relatório Detalhado</h2>
            {Object.entries(
              data.dados.reduce((acc, curr) => {
                if (!acc[curr.EMPRESA]) acc[curr.EMPRESA] = [];
                acc[curr.EMPRESA].push(curr);
                return acc;
              }, {})
            ).map(([empresa, funcionarios]) => (
              <div key={empresa} className="mb-6">
                <h3 className="font-bold text-lg mb-2">🏢 {empresa}</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="pb-2">Funcionário</th>
                        <th className="pb-2">Data Limite</th>
                        <th className="pb-2">Dias Restantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funcionarios.map((func, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="py-2">{func['foempregados.nome']}</td>
                          <td className="py-2">
                            {new Date(func.LIMITE_PARA_GOZO).toLocaleDateString()}
                          </td>
                          <td className="py-2">{func.DIAS_RESTANTES}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;