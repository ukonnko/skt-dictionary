# プロジェクトのルートディレクトリを作成
mkdir my-fullstack-app
cd my-fullstack-app

# バックエンド用のディレクトリを作成
mkdir backend
cd backend

# バックエンドの初期化
npm init -y
npm install express typescript ts-node @types/node @types/express pg @types/pg

# TypeScriptの設定ファイルを作成
npx tsc --init

# ルートディレクトリに戻る
cd ..

# フロントエンド用のReactアプリを作成
npx create-react-app frontend --template typescript