'use client';

import { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  HardHat,
  Smartphone,
  ShieldCheck,
  Building2,
  Layers,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  AlertCircle,
  FileCheck2,
  Camera,
  Mic,
  DollarSign,
  TrendingUp,
  FolderLock
} from 'lucide-react';

export default function ApresentacaoPage() {
  const [activeTab, setActiveTab] = useState<'campo' | 'organizacao' | 'gestao'>('campo');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="landing-root">
      {/* 1. Header / Navegação Superior */}
      <header className="landing-header">
        <div className="landing-container header-inner">
          <a href="/apresentacao" className="landing-brand">
            <img src="/zapiobra-logo.png" alt="ZapiObra — Gestão de Obras" width="160" height="42" />
          </a>
          <nav className="landing-nav">
            <a href="#projeto">O projeto</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#beta">Beta</a>
            <a href="#faq">Dúvidas</a>
          </nav>
          <div className="header-actions">
            <a href="/entrar" className="btn-access">
              Acessar painel
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="landing-hero" id="projeto">
        <div className="landing-container hero-grid">
          <div className="hero-content">
            <div className="badge-beta">
              <span className="badge-pulse"></span>
              ZapiObra · Versão Beta Operacional
            </div>
            <h1 className="hero-title">
              A obra acontece no campo. <br />
              <span className="text-highlight">A informação fica organizada.</span>
            </h1>
            <p className="hero-subtitle">
              Chega de fotos soltas, áudios perdidos e comprovantes esquecidos. O ZapiObra recebe as mensagens do WhatsApp do seu canteiro e transforma em lançamentos, despesas e relatórios organizados por obra no painel de gestão.
            </p>
            <div className="hero-buttons">
              <a href="#como-funciona" className="btn-primary">
                Entenda como funciona <ArrowRight size={18} />
              </a>
              <a href="#beta" className="btn-outline">
                Conheça a validação beta
              </a>
            </div>
            <div className="hero-trust">
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-brand-orange" />
                <span>Sem app novo para o pedreiro</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-brand-orange" />
                <span>100% separado por obra</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-brand-orange" />
                <span>Painel com controle do proprietário</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="mockup-frame">
              <div className="mockup-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="mockup-title">Fluxo em tempo real · WhatsApp → Painel</span>
              </div>
              <div className="mockup-body">
                {/* Mensagem simulada WhatsApp */}
                <div className="chat-bubble left">
                  <div className="bubble-sender">Mestre Carlos (Canteiro Obra Jardins)</div>
                  <p>Comprei 10 sacos de cimento CP-II e 2 rolos de arame recozido. Segue o comprovante da nota fiscal:</p>
                  <div className="chat-receipt-box">
                    <FileCheck2 size={24} className="text-brand-orange" />
                    <div>
                      <strong>NotaFiscal_DepositoSilva.pdf</strong>
                      <small>R$ 380,00 · 22/11/2026</small>
                    </div>
                  </div>
                  <span className="bubble-time">14:32</span>
                </div>

                {/* Seta de transformação */}
                <div className="flow-transform">
                  <span className="pulse-tag">ZapiObra processa e envia para a fila</span>
                </div>

                {/* Card no Painel do Gestor */}
                <div className="dashboard-preview-card">
                  <div className="preview-top">
                    <span className="badge-tag">Nova despesa pendente</span>
                    <span className="preview-val">R$ 380,00</span>
                  </div>
                  <div className="preview-details">
                    <div><strong>Obra:</strong> Residencial Jardins (Obra #04)</div>
                    <div><strong>Categoria:</strong> Cimento / Material Básico</div>
                    <div><strong>Responsável:</strong> Carlos Eduardo (Encarregado)</div>
                  </div>
                  <div className="preview-actions">
                    <span className="btn-mini-approve">Aprovar no painel</span>
                    <span className="btn-mini-view">Ver comprovante</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. O Problema */}
      <section className="section-problem">
        <div className="landing-container">
          <div className="section-header">
            <p className="eyebrow">O DESAFIO DO DIA A DIA</p>
            <h2>Por que a gestão financeira da obra tradicional vaza dinheiro?</h2>
            <p className="section-sub">
              No corre-corre do canteiro, os canais informais engolem dados vitais e geram retrabalho para o engenheiro e o financeiro.
            </p>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <div className="card-icon red-soft">
                <Camera size={24} />
              </div>
              <h3>Comprovantes e fotos espalhadas</h3>
              <p>Fotos de notas fiscais e recibos de compras urgentes se perdem na galeria de fotos do WhatsApp entre centenas de conversas.</p>
            </div>

            <div className="problem-card">
              <div className="card-icon orange-soft">
                <Mic size={24} />
              </div>
              <h3>Áudios sem histórico rastreável</h3>
              <p>O encarregado pede material por áudio de 2 minutos. A compra é feita, mas ninguém sabe a data exata, quem autorizou e o valor acordado.</p>
            </div>

            <div className="problem-card">
              <div className="card-icon yellow-soft">
                <Layers size={24} />
              </div>
              <h3>Mistura de contas entre obras</h3>
              <p>Quem tem mais de uma obra ativa sofre para saber se aquele caminhão de areia foi para a Obra A ou descarregado na Obra B.</p>
            </div>

            <div className="problem-card">
              <div className="card-icon blue-soft">
                <AlertCircle size={24} />
              </div>
              <h3>Aprovações sem conferência real</h3>
              <p>O gestor aprova pagamentos às cegas sem ter a certeza de que a despesa já não foi paga antes por outro sócio ou duplicada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Como Funciona (4 Etapas) */}
      <section className="section-workflow" id="como-funciona">
        <div className="landing-container">
          <div className="section-header">
            <p className="eyebrow">SIMPLES E DIRETO</p>
            <h2>Como o ZapiObra opera em 4 etapas</h2>
            <p className="section-sub">
              Do canteiro ao fechamento financeiro, tudo conectado sem complicar a rotina de quem constrói.
            </p>
          </div>

          <div className="workflow-steps">
            <div className="step-card">
              <div className="step-num">01</div>
              <h4>Registro pelo WhatsApp</h4>
              <p>O mestre ou encarregado envia texto, áudio ou foto no grupo oficial da obra já cadastrado.</p>
            </div>

            <div className="step-card">
              <div className="step-num">02</div>
              <h4>Organização Automática</h4>
              <p>O ZapiObra identifica o remetente autorizado, separa a mídia e aloca os dados diretamente na obra correta.</p>
            </div>

            <div className="step-card">
              <div className="step-num">03</div>
              <h4>Conferência e Decisão</h4>
              <p>O proprietário ou gerente abre o painel, confere os valores com o comprovante e aprova com um clique.</p>
            </div>

            <div className="step-card">
              <div className="step-num">04</div>
              <h4>Histórico e Auditoria</h4>
              <p>Tudo fica registrado com data, autor e arquivo original seguro, pronto para exportação e fechamento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Demonstração Interativa com Abas */}
      <section className="section-demo">
        <div className="landing-container">
          <div className="section-header">
            <p className="eyebrow">EXPERIÊNCIA NA PRÁTICA</p>
            <h2>Veja o ZapiObra em cada momento da operação</h2>
          </div>

          <div className="demo-tabs-nav">
            <button
              className={`tab-btn ${activeTab === 'campo' ? 'active' : ''}`}
              onClick={() => setActiveTab('campo')}
            >
              <Smartphone size={18} /> No Canteiro (Campo)
            </button>
            <button
              className={`tab-btn ${activeTab === 'organizacao' ? 'active' : ''}`}
              onClick={() => setActiveTab('organizacao')}
            >
              <Layers size={18} /> Na Conferência Inteligente
            </button>
            <button
              className={`tab-btn ${activeTab === 'gestao' ? 'active' : ''}`}
              onClick={() => setActiveTab('gestao')}
            >
              <Building2 size={18} /> No Painel de Gestão
            </button>
          </div>

          <div className="demo-tab-content">
            {activeTab === 'campo' && (
              <div className="tab-pane">
                <div className="pane-info">
                  <span className="badge-tag">Zero atrito para a equipe</span>
                  <h3>Ninguém precisa instalar nada novo</h3>
                  <p>
                    A equipe de obra já sabe mexer no WhatsApp. O encarregado só precisa postar a foto do cupom fiscal ou mandar um áudio simples explicando a compra.
                  </p>
                  <ul className="benefit-list">
                    <li><CheckCircle2 size={16} /> Aceita imagens de cupons e recibos (JPEG/PNG/PDF)</li>
                    <li><CheckCircle2 size={16} /> Suporta áudios explicativos com transcrição integrada</li>
                    <li><CheckCircle2 size={16} /> Validação apenas de números e pessoas autorizadas</li>
                  </ul>
                </div>
                <div className="pane-mockup">
                  <div className="phone-screen">
                    <div className="phone-chat-top">
                      <strong>Grupo: Obra Solar das Flores</strong>
                      <small>3 participantes · ZapiObra conectado</small>
                    </div>
                    <div className="phone-msg">
                      <span>Mestre Jorge:</span>
                      <p>R$ 145,00 de discos de corte e brocas na Ferragem Central. Segue foto do comprovante.</p>
                    </div>
                    <div className="phone-msg img">
                      <div className="receipt-fake">[Imagem do Comprovante R$ 145,00]</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'organizacao' && (
              <div className="tab-pane">
                <div className="pane-info">
                  <span className="badge-tag">Triagem e Segurança</span>
                  <h3>Fila de conferência anti-duplicidade</h3>
                  <p>
                    Tudo o que chega entra em uma fila organizada. O sistema compara comprovantes anteriores para alertar caso alguém tente lançar o mesmo recibo duas vezes.
                  </p>
                  <ul className="benefit-list">
                    <li><CheckCircle2 size={16} /> Hash SHA-256 criptográfico para barrar notas repetidas</li>
                    <li><CheckCircle2 size={16} /> Paginação segura para nunca esconder pendências antigas</li>
                    <li><CheckCircle2 size={16} /> Associação direta com a obra sem misturar orçamentos</li>
                  </ul>
                </div>
                <div className="pane-mockup">
                  <div className="inbox-demo-panel">
                    <div className="inbox-demo-header">Fila de Conferência · 1 pendência para revisar</div>
                    <div className="inbox-demo-row">
                      <strong>Mestre Jorge</strong> · Obra Solar das Flores
                      <p>Discos de corte e brocas na Ferragem Central</p>
                      <span className="val-tag">R$ 145,00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gestao' && (
              <div className="tab-pane">
                <div className="pane-info">
                  <span className="badge-tag">Controle do Proprietário</span>
                  <h3>Visão consolidada por obra e categoria</h3>
                  <p>
                    Acompanhe total de despesas aprovadas, controle de pagamento informado, auditoria completa de quem aprovou e exportação para planilhas em um clique.
                  </p>
                  <ul className="benefit-list">
                    <li><CheckCircle2 size={16} /> Bloqueio rigoroso de autoaprovação</li>
                    <li><CheckCircle2 size={16} /> Histórico imutável de auditoria</li>
                    <li><CheckCircle2 size={16} /> Exportação CSV para conciliação contábil</li>
                  </ul>
                </div>
                <div className="pane-mockup">
                  <div className="dashboard-demo-box">
                    <div className="dash-metric">
                      <span>Despesas Aprovadas</span>
                      <strong>R$ 48.720,00</strong>
                    </div>
                    <div className="dash-metric">
                      <span>Obras Ativas</span>
                      <strong>3 frentes</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Grade de Recursos com Status Técnico Real */}
      <section className="section-features" id="funcionalidades">
        <div className="landing-container">
          <div className="section-header">
            <p className="eyebrow">RECURSOS E TRANSPARÊNCIA</p>
            <h2>Funcionalidades do ZapiObra</h2>
            <p className="section-sub">
              Transparência total sobre o que já está validado e o que está em evolução no nosso beta.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-status status-validado">Validado</div>
              <div className="feature-icon"><MessageSquare size={22} /></div>
              <h4>Ingestão via WhatsApp</h4>
              <p>Recepção segura por webhook autenticado (HMAC SHA-256) para textos, fotos e áudios.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-validado">Validado</div>
              <div className="feature-icon"><Building2 size={22} /></div>
              <h4>Multi-Obras</h4>
              <p>Vínculo exclusivo de grupos e pessoas a obras específicas. Sem risco de contaminação de custos.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-validado">Validado</div>
              <div className="feature-icon"><ShieldCheck size={22} /></div>
              <h4>Anti-Autoaprovação</h4>
              <p>Segurança rigorosa: quem cria ou envia uma despesa não pode aprovar a si mesmo no painel.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-validado">Validado</div>
              <div className="feature-icon"><FolderLock size={22} /></div>
              <h4>Comprovantes Privados</h4>
              <p>Arquivos armazenados no Cloudflare R2 com hash criptográfico e acesso autenticado.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-validado">Validado</div>
              <div className="feature-icon"><DollarSign size={22} /></div>
              <h4>Valores Exatos em Centavos</h4>
              <p>Cálculo monetário com números inteiros para precisão contábil e zero erro de arredondamento.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-teste">Em teste no Beta</div>
              <div className="feature-icon"><Mic size={22} /></div>
              <h4>Transcrição de Áudios</h4>
              <p>Motor de conversão de recados de voz em texto transcrito para leitura rápida na conferência.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-validado">Validado</div>
              <div className="feature-icon"><Layers size={22} /></div>
              <h4>Fila com Paginação Segura</h4>
              <p>Pendências antigas nunca desaparecem. Navegação determinística por cursor no banco D1.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-teste">Em teste no Beta</div>
              <div className="feature-icon"><TrendingUp size={22} /></div>
              <h4>Alerta de Duplicidade</h4>
              <p>Deteção inteligente de cupons fiscais idênticos ou valores repetidos no mesmo dia.</p>
            </div>

            <div className="feature-card">
              <div className="feature-status status-planejado">Planejado</div>
              <div className="feature-icon"><Sparkles size={22} /></div>
              <h4>OCR Avançado de Itens</h4>
              <p>Extração automática linha a linha de cada insumo listado no cupom fiscal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Para quem foi pensado */}
      <section className="section-audience">
        <div className="landing-container">
          <div className="section-header">
            <p className="eyebrow">PÚBLICO-ALVO</p>
            <h2>Desenhado para quem vive a realidade do canteiro</h2>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <HardHat size={32} className="text-brand-orange" />
              <h3>Mestres e Encarregados</h3>
              <p>Sem senhas difíceis ou aplicativos pesados. Registram com a naturalidade de quem manda uma mensagem no WhatsApp.</p>
            </div>

            <div className="audience-card">
              <Building2 size={32} className="text-brand-orange" />
              <h3>Engenheiros e Gestores</h3>
              <p>Centralizam a conferência sem ter que pescar comprovantes no meio de bate-papos de grupos informais.</p>
            </div>

            <div className="audience-card">
              <ShieldCheck size={32} className="text-brand-orange" />
              <h3>Proprietários e Construtoras</h3>
              <p>Governança financeira real, rastreabilidade de cada real gasto e trilha de auditoria completa para prestar contas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Selo Beta e Compromisso de Validação */}
      <section className="section-beta" id="beta">
        <div className="landing-container">
          <div className="beta-box">
            <div className="beta-badge-large">FASE BETA OPERACIONAL</div>
            <h2>Em validação ativa em canteiro real</h2>
            <p>
              O ZapiObra não é um software genérico de prateleira. Ele está sendo testado e aprimorado semana a semana em frentes de obras reais (PST Construtora) para garantir máxima simplicidade e robustez antes de qualquer abertura em larga escala.
            </p>
            <div className="beta-specs">
              <div className="spec-item">
                <strong>Edge Computing</strong>
                <span>Cloudflare Workers + D1 Database</span>
              </div>
              <div className="spec-item">
                <strong>Autenticação Segura</strong>
                <span>Supabase Auth com sessão blindada</span>
              </div>
              <div className="spec-item">
                <strong>Disponibilidade</strong>
                <span>Acesso sob convite e autorização</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ Acordeão */}
      <section className="section-faq" id="faq">
        <div className="landing-container">
          <div className="section-header">
            <p className="eyebrow">TIRE SUAS DÚVIDAS</p>
            <h2>Perguntas frequentes sobre o ZapiObra</h2>
          </div>

          <div className="faq-accordion">
            {[
              {
                q: 'O ZapiObra já está aberto para contratação por qualquer empresa?',
                a: 'Não. O sistema está em fase beta restrita, com foco total na validação das rotinas de campo, segurança de dados e assertividade da conferência junto aos parceiros autorizados.'
              },
              {
                q: 'O pedreiro ou fornecedor precisa instalar algum aplicativo no celular?',
                a: 'Não. Esse é o maior diferencial do ZapiObra: no campo, tudo é feito pelo próprio WhatsApp que eles já usam todos os dias. O painel web com login é exclusivo para quem gerencia e aprova as contas.'
              },
              {
                q: 'Quem tem permissão para aprovar despesas e pagamentos?',
                a: 'Apenas os usuários cadastrados como Proprietário (Owner) ou Gerente (Manager). Além disso, existe o bloqueio rígido de autoaprovação: ninguém pode aprovar um lançamento feito por si próprio.'
              },
              {
                q: 'O sistema faz transferência ou pagamento bancário automático?',
                a: 'Não. O ZapiObra é um sistema de governança, auditoria e conferência de despesas. Ele registra o comprovante, confirma a aprovação e documenta se o pagamento foi informado, sem movimentar dinheiro de bancos.'
              },
              {
                q: 'Como são tratadas as fotos de comprovantes e recibos?',
                a: 'Todas as imagens são criptografadas com hash SHA-256 e guardadas em storage privado (Cloudflare R2). Elas não possuem link público e só podem ser visualizadas por quem tem login autorizado na obra correspondente.'
              }
            ].map((faq, i) => (
              <div className="faq-item" key={i}>
                <button
                  type="button"
                  className={`faq-question ${openFaq === i ? 'open' : ''}`}
                  onClick={() => toggleFaq(i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={20} className="faq-arrow" />
                </button>
                {openFaq === i && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Rodapé */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-brand">
            <img src="/zapiobra-logo.png" alt="ZapiObra" width="140" height="36" />
            <p>Gestão de obras com entrada pelo WhatsApp e controle financeiro rastreável.</p>
          </div>
          <div className="footer-links">
            <a href="/entrar">Acessar painel</a>
            <a href="#projeto">O projeto</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#beta">Validação Beta</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="landing-container">
            <p>ZAPIOBRA · Projeto ALQVIMIA © 2026. Todos os direitos reservados. Ambiente operacional privado.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
