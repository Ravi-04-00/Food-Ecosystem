from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import permissions

SWAGGER_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FD FOOD Ecosystem API Documentation & Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0B1230; font-family: Inter, sans-serif; color: #fff; }
    .topbar { display: none; }
    .swagger-ui .info .title { color: #FF5A1F !important; font-family: Poppins, sans-serif; font-weight: 800; }
    .swagger-ui .scheme-container { background: #0F172A; border-bottom: 1px solid #1E293B; }
    .swagger-ui .opblock { border-radius: 12px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/schema/',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true
      });
    };
  </script>
</body>
</html>
"""

class SwaggerUIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return HttpResponse(SWAGGER_HTML, content_type='text/html')
