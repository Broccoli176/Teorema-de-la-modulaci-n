# Teorema de la modulación · Señales y Sistemas

Presentación académica construida con **reveal.js 6.0.2** (incluido localmente) y **MathJax 3** (vía CDN).
No requiere instalar dependencias ni ejecutar procesos de compilación: basta con abrir `index.html`.

## Contenido

1. Portada
2. Agenda
3. Motivación: ¿por qué modular?
4. Repaso de la transformada de Fourier
5. Enunciado del teorema de la modulación
6. Demostración paso a paso
7. Interpretación espectral **interactiva**
8. Demodulación coherente
9. Modulación AM **interactiva**
10. Tipos de modulación (AM, DSB-SC, SSB, FM)
11. Ejemplo numérico
12. Aplicaciones reales
13. Modulación I/Q y QAM
14. Conclusiones
15. Referencias

## Cómo verla

### En local

Descarga el repositorio y abre `index.html` en cualquier navegador moderno.
Funciona directamente con el protocolo `file://` (no necesita servidor).

Si prefieres servirla por HTTP:

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js (sin instalar nada globalmente)
npx serve .
```

Luego visita `http://localhost:8000`.

### Controles

| Tecla | Acción |
| --- | --- |
| `←` `→` / `Espacio` | Navegar entre diapositivas |
| `F` | Pantalla completa |
| `S` | Notas del expositor |
| `O` | Vista general |
| `Esc` | Salir de la vista general |

## Publicar en GitHub Pages

1. Crea un repositorio **público** en GitHub, por ejemplo `teorema-modulacion`.
2. Sube todo el contenido de esta carpeta:

   ```bash
   git init
   git add .
   git commit -m "Presentación: Teorema de la modulación"
   git branch -M main
   git remote add origin https://github.com/<usuario>/<repo>.git
   git push -u origin main
   ```

3. En GitHub, entra en **Settings → Pages**.
4. En *Build and deployment*, selecciona **Deploy from a branch**.
5. Elige la rama `main` y la carpeta `/ (root)`. Guarda los cambios.
6. Espera uno o dos minutos. La presentación quedará disponible en:

   ```
   https://<usuario>.github.io/<repo>/
   ```

### Enlaces del grupo

- **Presentación en GitHub Pages:** `https://<usuario>.github.io/<repo>/`
- **Repositorio público:** `https://github.com/<usuario>/<repo>`

> Sustituye `<usuario>` y `<repo>` por los datos reales del repositorio.

## Estructura del proyecto

```
.
├── index.html                  # Todas las diapositivas
├── css/
│   └── custom.css              # Tema oscuro personalizado
├── js/
│   └── presentation.js         # Visualizaciones interactivas (canvas)
├── assets/
│   └── favicon.svg
├── dist/                       # reveal.js 6.0.2 (incluido localmente)
│   ├── reveal.js
│   ├── reveal.css
│   ├── reset.css
│   ├── plugin/
│   │   ├── math.js
│   │   └── notes.js
│   └── theme/
│       └── black.css
├── LICENSE-revealjs.txt        # Licencia MIT de reveal.js
├── .nojekyll                   # Evita el procesamiento de Jekyll en Pages
└── README.md
```

## Recursos

- [reveal.js](https://revealjs.com/) — framework de presentaciones (MIT).
- [MathJax 3](https://www.mathjax.org/) — renderizado de fórmulas (Apache 2.0), cargado desde jsDelivr.
- Tipografías: *Source Sans Pro* va embebida en `dist/theme/black.css`; el resto usa fuentes del sistema.

## Nota sobre las dependencias

- **reveal.js** está incluido en `dist/`, por lo que la presentación funciona sin conexión.
- **MathJax** se carga desde CDN (`cdn.jsdelivr.net`). Si no hay conexión, las fórmulas se muestran como texto LaTeX sin renderizar; el resto de la presentación sigue funcionando.

## Licencia

El contenido de la presentación es de libre uso académico.
reveal.js se distribuye bajo licencia MIT (ver `LICENSE-revealjs.txt`).
