# 🎬 CineMatch (NextWatch Sessions)

O **CineMatch** é um aplicativo Web / PWA inteligente e social que resolve o eterno dilema de "O que vamos assistir hoje?". 

Com um design premium inspirado nos melhores aplicativos de entretenimento e uma interface interativa no estilo *Tinder* (Swipe), o app cruza as suas preferências, o seu humor atual e os seus catálogos de streaming para indicar o filme ou série ideal.

---

## ✨ Funcionalidades Principais

- 👆 **Match Dinâmico (Swipe):** Arraste para a direita se gostou, para a esquerda se não gostou. O algoritmo aprende o seu gosto (DNA Cinéfilo) a cada curtida.
- 🍿 **Sessões em Grupo:** Crie um link, mande no grupo do WhatsApp e todos dão "swipe". O aplicativo avisa na hora quando der "Match" (quando todos curtirem o mesmo filme).
- 📱 **Progressive Web App (PWA):** Instalável no celular como um aplicativo nativo. Ícone na tela inicial e abertura sem barra de navegação.
- 📺 **Filtros de Streaming Premium:** Marque quais streamings você assina (Netflix, Prime, Max, etc) nas Configurações. O app **só vai te sugerir filmes que você pode assistir**.
- 🚫 **Bloqueio de Gêneros:** Não gosta de Terror? Adicione na sua lista negra e nunca mais receba essas recomendações.
- ⭐ **Avaliações e Watchlist:** Salve os filmes para ver depois, crie listas personalizadas (Coleções) e deixe notas ou resenhas na página dos filmes.
- 🛡️ **Segurança em 1º Lugar:** Banco de dados Firebase blindado com regras de segurança estritas e integração com o Google App Check (reCAPTCHA v3) anti-bots.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS, Framer Motion (para animações de Swipe), Lucide (Ícones)
- **Banco de Dados & Auth:** Firebase (Authentication, Firestore Database, Storage)
- **APIs Externas:** TMDB API (The Movie Database) para o catálogo oficial de filmes e streamings do Brasil.

---

## 🚀 Como Rodar Localmente

### 1. Requisitos
- [Node.js](https://nodejs.org/en/) instalado (versão 18+).
- Conta ativa no [Firebase](https://firebase.google.com/).
- Conta ativa no [TMDB](https://www.themoviedb.org/) para gerar a API Key.

### 2. Passos

```bash
# Clone este repositório
git clone https://github.com/leopresses/CineMatch.git

# Entre na pasta
cd CineMatch

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

*Opcional: Crie um arquivo `.env` na raiz do projeto contendo as suas chaves do Firebase se não quiser usar as que estão direto no código.*

---

## ☁️ Como Hospedar (Deploy)

Este projeto já está configurado para o **Firebase Hosting** e para a **Vercel**.

**Para deploy rápido via Vercel:**
Acesse [vercel.com](https://vercel.com/), faça login com o GitHub, importe este repositório e clique em Deploy.

**Para deploy via Firebase Hosting:**
```bash
npm install -g firebase-tools
npm run build
firebase login
firebase deploy --only hosting
```

---
*Feito com 💡 por Léo Presses e Antigravity IA.*
