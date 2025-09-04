const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Banco de dados
const db = new sqlite3.Database('./leads.db');

// Criar tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    interesse TEXT,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ativo'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    cpf TEXT NOT NULL,
    telefone TEXT NOT NULL,
    metodo_pagamento TEXT NOT NULL,
    produtos TEXT NOT NULL,
    valor_total REAL NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    produtos_comprados TEXT,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ativo'
  )`);
});

// Rotas
app.post('/api/leads', (req, res) => {
  const { nome, email, telefone, interesse } = req.body;
  
  db.run(
    'INSERT INTO leads (nome, email, telefone, interesse) VALUES (?, ?, ?, ?)',
    [nome, email, telefone, interesse],
    function(err) {
      if (err) {
        return res.status(400).json({ erro: 'Email já cadastrado' });
      }
      
      console.log(`✅ Novo lead: ${nome} - ${email}`);
      
      res.json({ 
        sucesso: true, 
        mensagem: 'Cadastro realizado com sucesso! (Email será configurado em breve)',
        leadId: this.lastID 
      });
    }
  );
});

app.get('/api/dashboard', (req, res) => {
  db.all(`
    SELECT 
      COUNT(*) as total_leads,
      COUNT(CASE WHEN date(data_cadastro) = date('now') THEN 1 END) as leads_hoje,
      COUNT(CASE WHEN date(data_cadastro) >= date('now', '-7 days') THEN 1 END) as leads_semana
    FROM leads
  `, (err, result) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    
    res.json({
      leads: result[0],
      faturamento: 0
    });
  });
});

app.post('/api/processar-pagamento', (req, res) => {
  const { nome, email, cpf, telefone, metodoPagamento, carrinho, total } = req.body;
  
  if (!nome || !email || !cpf || !telefone || !metodoPagamento || !carrinho) {
    return res.status(400).json({ erro: 'Dados incompletos' });
  }

  const produtosJson = JSON.stringify(carrinho);
  
  db.run(
    'INSERT INTO pedidos (nome, email, cpf, telefone, metodo_pagamento, produtos, valor_total) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nome, email, cpf, telefone, metodoPagamento, produtosJson, total],
    function(err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao processar pedido' });
      }
      
      const pedidoId = this.lastID;
      console.log(`💰 Nova venda: ${nome} - R$ ${total}`);
      
      // Criar usuário na área de membros
      const senhaTemporaria = Math.random().toString(36).slice(-8);
      const produtosComprados = carrinho.map(item => item.id).join(',');
      
      db.run(
        'INSERT OR REPLACE INTO usuarios (nome, email, senha, produtos_comprados) VALUES (?, ?, ?, ?)',
        [nome, email, senhaTemporaria, produtosComprados]
      );
      
      res.json({ 
        sucesso: true, 
        pedidoId: pedidoId,
        mensagem: 'Pedido processado com sucesso!' 
      });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  
  db.get(
    'SELECT * FROM usuarios WHERE email = ?',
    [email],
    (err, usuario) => {
      if (err || !usuario) {
        return res.status(401).json({ erro: 'Usuário não encontrado' });
      }
      
      res.json({
        sucesso: true,
        usuario: {
          nome: usuario.nome,
          email: usuario.email,
          produtos: usuario.produtos_comprados
        }
      });
    }
  );
});

app.get('/api/pedidos', (req, res) => {
  db.all(
    'SELECT COUNT(*) as total_pedidos, SUM(valor_total) as faturamento_total FROM pedidos',
    (err, result) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      res.json({
        pedidos: result[0].total_pedidos || 0,
        faturamento: result[0].faturamento_total || 0
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Site: http://localhost:${PORT}`);
  console.log(`🛒 Produtos: http://localhost:${PORT}/produtos.html`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`⚠️  Email desabilitado - configure depois se necessário`);
});
