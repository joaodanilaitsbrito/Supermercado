// ══════════════════════════════════════
//  app.js
//  Lógica principal do PDV SuperMais
// ══════════════════════════════════════

// ── ESTADO ─────────────────────────────
let operador  = null;
let itens     = [];
let desconto  = 0;
let formaPgto = 'dinheiro';
let vendaId   = null;

// ── RELÓGIO ────────────────────────────
function tick() {
  const agora = new Date();
  document.getElementById('relogio').textContent   = agora.toLocaleTimeString('pt-BR');
  document.getElementById('disp-data').textContent = agora.toLocaleDateString('pt-BR');
}
tick();
setInterval(tick, 1000);

// ── UTILITÁRIOS ────────────────────────
const brl = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + tipo;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

// ══════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════
document.getElementById('login-senha').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-entrar').click();
});

document.getElementById('btn-entrar').addEventListener('click', async () => {
  const mat   = document.getElementById('login-matricula').value.trim().toUpperCase();
  const senha = document.getElementById('login-senha').value.trim();
  const erro  = document.getElementById('login-erro');
  erro.style.display = 'none';

  if (!mat || !senha) {
    erro.textContent = 'Preencha matrícula e senha.';
    erro.style.display = 'block';
    return;
  }

  const btn = document.getElementById('btn-entrar');
  btn.innerHTML = '<span class="loading"></span>';

  try {
    const { data, error } = await db
      .from('operadores')
      .select('*')
      .eq('matricula', mat)
      .eq('senha', senha)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      erro.textContent = 'Matrícula ou senha inválidos.';
      erro.style.display = 'block';
      btn.textContent = 'ENTRAR NO CAIXA';
      return;
    }

    operador = data;
    const iniciais = data.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    document.getElementById('avatar-op').textContent = iniciais;
    document.getElementById('nome-op').textContent   = data.nome;
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('input-codigo').focus();
    toast('Bem-vindo, ' + data.nome.split(' ')[0] + '! ✓', 'ok');

  } catch (e) {
    erro.textContent = 'Erro ao conectar. Verifique sua conexão.';
    erro.style.display = 'block';
    btn.textContent = 'ENTRAR NO CAIXA';
  }
});

// ══════════════════════════════════════
//  LOGOUT
// ══════════════════════════════════════
document.getElementById('btn-sair').addEventListener('click', () => {
  if (itens.length > 0 && !confirm('Há uma venda em andamento. Deseja sair mesmo assim?')) return;
  operador = null; itens = []; desconto = 0;
  document.getElementById('app').style.display = 'none';
  document.getElementById('tela-login').style.display = 'flex';
  document.getElementById('login-matricula').value = '';
  document.getElementById('login-senha').value = '';
  document.getElementById('btn-entrar').textContent = 'ENTRAR NO CAIXA';
});

// ══════════════════════════════════════
//  BUSCA POR CÓDIGO DE BARRAS
// ══════════════════════════════════════
document.getElementById('input-codigo').addEventListener('keydown', async e => {
  if (e.key !== 'Enter') return;
  const cod = e.target.value.trim();
  if (!cod) return;
  await adicionarPorCodigo(cod);
  e.target.value = '';
});

document.getElementById('btn-add-codigo').addEventListener('click', async () => {
  const inp = document.getElementById('input-codigo');
  const cod = inp.value.trim();
  if (!cod) return;
  await adicionarPorCodigo(cod);
  inp.value = '';
  inp.focus();
});

async function adicionarPorCodigo(cod) {
  const { data, error } = await db
    .from('produtos')
    .select('*, categorias(nome)')
    .eq('codigo_barras', cod)
    .eq('ativo', true)
    .single();

  if (error || !data) { toast('Produto não encontrado: ' + cod, 'erro'); return; }
  adicionarItem(data);
}

// ══════════════════════════════════════
//  BUSCA POR NOME
// ══════════════════════════════════════
let timerBusca;

document.getElementById('input-nome').addEventListener('input', e => {
  clearTimeout(timerBusca);
  const q = e.target.value.trim();
  if (q.length < 2) { document.getElementById('sugestoes').innerHTML = ''; return; }
  timerBusca = setTimeout(() => buscarPorNome(q), 280);
});

document.getElementById('btn-buscar-nome').addEventListener('click', () => {
  const q = document.getElementById('input-nome').value.trim();
  if (q.length >= 2) buscarPorNome(q);
});

async function buscarPorNome(q) {
  const { data } = await db
    .from('produtos')
    .select('*')
    .ilike('nome', '%' + q + '%')
    .eq('ativo', true)
    .limit(12);

  const box = document.getElementById('sugestoes');
  box.innerHTML = '';

  if (!data || data.length === 0) {
    box.innerHTML = '<span style="font-size:13px;color:var(--texto-dim)">Nenhum produto encontrado.</span>';
    return;
  }

  data.forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${p.nome} <span class="preco">${brl(p.preco)}</span>`;
    chip.addEventListener('click', () => {
      adicionarItem(p);
      box.innerHTML = '';
      document.getElementById('input-nome').value = '';
    });
    box.appendChild(chip);
  });
}

// ══════════════════════════════════════
//  ADICIONAR ITEM
// ══════════════════════════════════════
function adicionarItem(produto) {
  const existe = itens.find(i => i.produto.id === produto.id);
  if (existe) {
    existe.quantidade += 1;
  } else {
    itens.push({ produto, quantidade: 1 });
  }
  renderItens();
  document.getElementById('disp-prod').textContent = `▶  ${produto.nome}  —  ${brl(produto.preco)}`;
  document.getElementById('disp-itens').textContent = itens.reduce((s, i) => s + i.quantidade, 0) + ' itens';
  toast(produto.nome + ' adicionado ✓', 'ok');
}

// ══════════════════════════════════════
//  RENDERIZAR TABELA
// ══════════════════════════════════════
function renderItens() {
  const tbody = document.getElementById('tbody-itens');
  tbody.innerHTML = '';

  if (itens.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="msg-vazia"><div class="icone">🛒</div><p>Nenhum produto adicionado.<br>Escaneie ou busque um produto.</p></div></td></tr>`;
    document.getElementById('badge-qtd').textContent = '0';
    calcular();
    return;
  }

  let totalItens = 0;
  itens.forEach((item, idx) => {
    const sub = item.produto.preco * item.quantidade;
    totalItens += item.quantidade;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-cod">${item.produto.codigo_barras.slice(-7)}</td>
      <td class="td-nome" title="${item.produto.nome}">${item.produto.nome}</td>
      <td class="td-unit">${item.produto.unidade}</td>
      <td><div class="ctrl-qtd">
        <button class="btn-qtd" onclick="alterarQtd(${idx},-1)">−</button>
        <span class="num-qtd">${item.quantidade}</span>
        <button class="btn-qtd" onclick="alterarQtd(${idx},1)">+</button>
      </div></td>
      <td class="td-preco">${brl(item.produto.preco)}</td>
      <td class="td-sub">${brl(sub)}</td>
      <td><button class="btn-del" onclick="removerItem(${idx})">✕</button></td>
    `;
    tbody.appendChild(tr);
    if (idx === itens.length - 1) setTimeout(() => tr.classList.add('flash'), 10);
  });

  document.getElementById('badge-qtd').textContent = totalItens;
  calcular();
}

// ══════════════════════════════════════
//  QUANTIDADE / REMOÇÃO
// ══════════════════════════════════════
function alterarQtd(idx, delta) {
  itens[idx].quantidade += delta;
  if (itens[idx].quantidade <= 0) itens.splice(idx, 1);
  renderItens();
}

function removerItem(idx) {
  itens.splice(idx, 1);
  renderItens();
}

// ══════════════════════════════════════
//  CÁLCULOS
// ══════════════════════════════════════
function calcular() {
  const subtotal = itens.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);
  const desc     = Math.min(desconto, subtotal);
  const total    = Math.max(0, subtotal - desc);

  document.getElementById('res-subtotal').textContent = brl(subtotal);
  document.getElementById('res-desc').textContent     = brl(desc);
  document.getElementById('res-total').textContent    = brl(total);
  document.getElementById('disp-total').textContent   = brl(total);

  const pago  = parseFloat(document.getElementById('input-pago').value) || 0;
  const troco = Math.max(0, pago - total);
  document.getElementById('troco-val').textContent = brl(troco);

  return { subtotal, desc, total };
}

// ══════════════════════════════════════
//  DESCONTO
// ══════════════════════════════════════
document.getElementById('btn-aplicar-desc').addEventListener('click', () => {
  const v        = parseFloat(document.getElementById('input-desc').value) || 0;
  const subtotal = itens.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);
  if (v < 0 || v > subtotal) { toast('Desconto inválido.', 'erro'); return; }
  desconto = v;
  calcular();
  toast(`Desconto de ${brl(v)} aplicado ✓`, 'ok');
});

// ══════════════════════════════════════
//  FORMA DE PAGAMENTO
// ══════════════════════════════════════
document.querySelectorAll('.btn-forma').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-forma').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    formaPgto = btn.dataset.forma;
    const eh_dinheiro = formaPgto === 'dinheiro';
    document.getElementById('bloco-troco').style.display  = eh_dinheiro ? 'block' : 'none';
    document.getElementById('troco-result').style.display = eh_dinheiro ? 'flex'  : 'none';
  });
});

document.getElementById('input-pago').addEventListener('input', calcular);

// ══════════════════════════════════════
//  CANCELAR
// ══════════════════════════════════════
document.getElementById('btn-cancelar').addEventListener('click', () => {
  if (itens.length === 0) return;
  if (!confirm('Cancelar a venda? Todos os itens serão removidos.')) return;
  itens = []; desconto = 0;
  ['input-desc','input-pago','input-codigo','input-nome'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sugestoes').innerHTML = '';
  document.getElementById('disp-prod').textContent = 'Aguardando produto...';
  renderItens();
  toast('Venda cancelada.', 'erro');
});

// ══════════════════════════════════════
//  FINALIZAR
// ══════════════════════════════════════
document.getElementById('btn-finalizar').addEventListener('click', async () => {
  if (itens.length === 0) { toast('Adicione pelo menos um produto.', 'erro'); return; }

  const { subtotal, desc, total } = calcular();
  const pago = parseFloat(document.getElementById('input-pago').value) || 0;

  if (formaPgto === 'dinheiro' && pago < total) { toast('Valor recebido insuficiente.', 'erro'); return; }

  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> Salvando...';

  try {
    const { data: venda, error: ve } = await db
      .from('vendas')
      .insert({
        operador_id:     operador.id,
        subtotal, desconto: desc, total,
        forma_pagamento: formaPgto,
        valor_pago:      formaPgto === 'dinheiro' ? pago : total,
        troco:           formaPgto === 'dinheiro' ? Math.max(0, pago - total) : 0,
        status:          'finalizada',
        finalizado_em:   new Date().toISOString()
      })
      .select().single();

    if (ve) throw ve;

    const { error: ie } = await db.from('itens_venda').insert(
      itens.map(i => ({
        venda_id: venda.id, produto_id: i.produto.id,
        quantidade: i.quantidade, preco_unit: i.produto.preco,
        subtotal: i.produto.preco * i.quantidade
      }))
    );
    if (ie) throw ie;

    const troco = formaPgto === 'dinheiro' ? Math.max(0, pago - total) : 0;
    document.getElementById('modal-sub').textContent =
      `Venda #${String(venda.id).padStart(5,'0')} — ${brl(total)} — ${formaPgto.toUpperCase()}`;

    const blocoTroco = document.getElementById('modal-troco-bloco');
    blocoTroco.style.display = troco > 0 ? 'block' : 'none';
    if (troco > 0) document.getElementById('modal-troco-val').textContent = brl(troco);

    document.getElementById('modal-sucesso').classList.add('show');

  } catch (e) {
    toast('Erro ao salvar: ' + e.message, 'erro');
    btn.disabled = false;
    btn.textContent = '✓ FINALIZAR';
  }
});

// ══════════════════════════════════════
//  NOVA VENDA
// ══════════════════════════════════════
document.getElementById('btn-nova-venda').addEventListener('click', () => {
  itens = []; desconto = 0; vendaId = null;
  ['input-desc','input-pago','input-codigo','input-nome'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sugestoes').innerHTML = '';
  document.getElementById('disp-prod').textContent = 'Aguardando produto...';
  document.getElementById('btn-finalizar').disabled = false;
  document.getElementById('btn-finalizar').textContent = '✓ FINALIZAR';
  renderItens();
  document.getElementById('modal-sucesso').classList.remove('show');
  document.getElementById('input-codigo').focus();
});

// ══════════════════════════════════════
//  ATALHOS DE TECLADO
// ══════════════════════════════════════
document.addEventListener('keydown', e => {
  if (document.getElementById('tela-login').style.display !== 'none') return;
  if (e.key === 'F2')  { e.preventDefault(); document.getElementById('input-codigo').focus(); }
  if (e.key === 'F4')  { e.preventDefault(); document.getElementById('btn-cancelar').click(); }
  if (e.key === 'F12') { e.preventDefault(); document.getElementById('btn-finalizar').click(); }
});

// ══════════════════════════════════════
//  INICIALIZAÇÃO
// ══════════════════════════════════════
renderItens();
calcular();
