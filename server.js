const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
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

// Configuração de email
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('✅ Email configurado e ativo!');
} else {
  console.log('⚠️ Email não configurado');
}

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
      
      // Enviar email de boas-vindas para o lead
      if (transporter) {
        const mailOptionsLead = {
          from: `"${process.env.SENDER_NAME || 'Equipe Milhão Digital'}" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: '🎉 Bem-vindo! Sua jornada para o milhão começa agora',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">💰 ${process.env.BUSINESS_NAME || 'Milhão Digital'}</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Transforme sua vida financeira!</p>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
                <h2 style="color: #2c5aa0; margin-top: 0;">Olá ${nome}! 👋</h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  <strong>Parabéns por dar o primeiro passo!</strong> Você acabou de se juntar a milhares de pessoas que estão transformando suas vidas financeiras através da monetização online.
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #ff6b35; margin-top: 0;">🎁 Seus próximos passos:</h3>
                  <ul style="color: #333; line-height: 1.8;">
                    <li>✅ <strong>Guia gratuito:</strong> "Primeiros R$ 5K Online" (em breve no seu email)</li>
                    <li>✅ <strong>Acesso VIP:</strong> Conteúdos exclusivos toda semana</li>
                    <li>✅ <strong>Comunidade:</strong> Grupo no Telegram com outros empreendedores</li>
                    <li>✅ <strong>Webinar gratuito:</strong> "Como sair do zero aos R$ 10K/mês"</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://site-monetizacao.onrender.com/produtos.html" 
                     style="background: linear-gradient(135deg, #ff6b35 0%, #f59e0b 100%); 
                            color: white; padding: 15px 30px; text-decoration: none; 
                            border-radius: 8px; font-weight: bold; display: inline-block;">
                    🚀 Ver Produtos Disponíveis
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                  Atenciosamente,<br>
                  <strong>${process.env.OWNER_NAME || 'Professor Empreendedor'}</strong><br>
                  ${process.env.BUSINESS_NAME || 'Milhão Digital'}
                </p>
              </div>
            </div>
          `
        };
        
        transporter.sendMail(mailOptionsLead, (error, info) => {
          if (error) {
            console.log('❌ Erro ao enviar email para lead:', error);
          } else {
            console.log('✅ Email enviado para lead:', info.response);
          }
        });

        // Enviar notificação para você
        const mailOptionsOwner = {
          from: `"${process.env.SENDER_NAME || 'Sistema'}" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: `🔔 Novo Lead: ${nome}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c5aa0;">🎉 Novo Lead Capturado!</h2>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Dados do Lead:</h3>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${telefone || 'Não informado'}</p>
                <p><strong>Interesse:</strong> ${interesse || 'Não especificado'}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              </div>
              
              <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #155724;">
                  <strong>💡 Dica:</strong> Entre em contato nas próximas 24h para maximizar a conversão!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://site-monetizacao.onrender.com/dashboard.html" 
                   style="background: #2c5aa0; color: white; padding: 12px 25px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  📊 Ver Dashboard
                </a>
              </div>
            </div>
          `
        };
        
        transporter.sendMail(mailOptionsOwner, (error, info) => {
          if (error) {
            console.log('❌ Erro ao enviar notificação:', error);
          } else {
            console.log('✅ Notificação enviada para owner:', info.response);
          }
        });
      }
      
      res.json({ 
        sucesso: true, 
        mensagem: transporter ? 
          'Cadastro realizado com sucesso! Verifique seu email.' : 
          'Cadastro realizado com sucesso! (Email será configurado em breve)',
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
  
  if (transporter) {
    console.log(`✅ Email ATIVO - Enviando emails automaticamente!`);
  } else {
    console.log(`⚠️ Email NÃO configurado - Configure as variáveis EMAIL_USER e EMAIL_PASS`);
  }
});
