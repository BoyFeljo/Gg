echo 'export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Lidar com preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Apenas GET permitido
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Extrair o ID da série da query string ou do caminho
    let { id } = req.query;
    
    // Se não tiver na query, verificar no caminho (para /api/66732)
    if (!id && req.url && req.url.startsWith("/api/")) {
      const pathParts = req.url.split("/");
      id = pathParts[pathParts.length - 1];
    }

    if (!id || isNaN(id)) {
      return res.status(400).send(`
        <html>
          <body style="background: #000; color: #fff; padding: 20px; font-family: Arial;">
            <h1>Erro: ID não fornecido ou inválido</h1>
            <p>Uso correto:</p>
            <ul>
              <li>https://seu-app.vercel.app/api?id=66732</li>
              <li>https://seu-app.vercel.app/api/66732</li>
              <li>https://seu-app.vercel.app/player/66732</li>
              <li>https://seu-app.vercel.app/66732</li>
            </ul>
            <p>Exemplo: <a href="/api/66732" style="color: #4CAF50;">/api/66732</a></p>
          </body>
        </html>
      `);
    }

    const urlPlayer = \`https://player.fimoo.site/embed/\${id}\`;
    const refererOrigin = "https://hyper.hyperappz.site";

    // Gerar HTML com headers embutidos
    const html = \`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src * \'self\' \'unsafe-inline\' \'unsafe-eval\' data: blob:;">
    <title>Player Série #\${id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #000; 
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            overflow-x: hidden;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 10px 10px 0 0;
            color: white;
            text-align: center;
            margin-bottom: 5px;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .player-container {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            background: #111;
            border-radius: 0 0 10px 10px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.7);
        }
        iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #667eea;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .controls {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }
        .info {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            color: #ccc;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header { padding: 15px; }
            .header h1 { font-size: 20px; }
            .btn { padding: 10px 20px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 Player de Série</h1>
            <p>ID: \${id} | Carregando conteúdo...</p>
        </div>
        
        <div class="player-container">
            <div class="loading">
                <div class="spinner"></div>
                <span>Carregando player...</span>
            </div>
            <iframe 
                id="playerFrame"
                src="\${urlPlayer}"
                allow="autoplay; encrypted-media; fullscreen"
                allowfullscreen
                scrolling="no"
                frameborder="0"
            ></iframe>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="toggleFullscreen()">
                <span>⛶</span> Tela Cheia
            </button>
            <button class="btn" onclick="reloadPlayer()">
                <span>🔄</span> Recarregar
            </button>
            <button class="btn" onclick="goBack()">
                <span>←</span> Voltar
            </button>
        </div>
        
        <div class="info">
            <p>📱 Compatível com dispositivos móveis | 🔒 Conexão segura</p>
            <p style="font-size: 12px; margin-top: 10px; opacity: 0.7;">
                Player otimizado para Android WebView
            </p>
        </div>
    </div>

    <script>
        // Configurar quando o iframe carregar
        const iframe = document.getElementById("playerFrame");
        const loading = document.querySelector(".loading");
        
        iframe.onload = function() {
            loading.style.display = "none";
            console.log("Player carregado com sucesso!");
            
            // Tentar injetar headers via postMessage
            try {
                iframe.contentWindow.postMessage({
                    type: "setHeaders",
                    referer: "\${refererOrigin}",
                    origin: "\${refererOrigin}"
                }, "*");
            } catch(e) {
                console.log("Headers configurados no servidor");
            }
        };
        
        // Funções de controle
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(console.log);
            } else {
                document.exitFullscreen();
            }
        }
        
        function reloadPlayer() {
            loading.style.display = "flex";
            iframe.src = iframe.src;
        }
        
        function goBack() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.close();
            }
        }
        
        // Configurações para WebView Android
        window.addEventListener("message", function(event) {
            if (event.data === "webviewReady") {
                console.log("WebView Android pronto");
            }
        });
        
        // Detectar tecla ESC para sair do fullscreen
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && document.fullscreenElement) {
                document.exitFullscreen();
            }
        });
    </script>
</body>
</html>\`;

    // Configurar headers de resposta
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=7200, s-maxage=3600");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Enviar resposta
    return res.status(200).send(html);

  } catch (error) {
    console.error("Erro na API:", error);
    return res.status(500).send(\`
      <html>
        <body style="background: #000; color: #fff; padding: 20px;">
          <h1>Erro interno do servidor</h1>
          <p>Tente novamente mais tarde</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Tentar novamente
          </button>
        </body>
      </html>
    \`);
  }
}' > index.js
