import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {API} from '../../lib/site';

async function authFetch(path, token) {
  const r = await fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (r.status === 401 || r.status === 403) return null;
  return r.json().catch(() => null);
}

function moduleLabel(code = '') {
  return {
    MANAGEMENT: 'Administração',
    MESA: 'Mesa',
    TRANSMISSION: 'Transmissão',
    ARBITRATION: 'Arbitragem',
    TEAM_PORTAL: 'Portal da Equipe',
    FINANCE_VIEW: 'Financeiro · Consulta',
    FINANCE_MANAGE: 'Financeiro · Gestão',
    ATHLETE_PORTAL: 'Portal do Atleta',
  }[String(code).toUpperCase()] || code;
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'L3';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function roleSummary({ athlete, teams, organizations, competitions, officials }) {
  const items = [];
  if (athlete) items.push('Atleta');
  if (teams.length) items.push('Equipe');
  if (officials.length) items.push('Arbitragem');
  if (competitions.length) items.push('Campeonato');
  if (organizations.length) items.push('Organização');
  return items.length ? items.join(' · ') : 'Aguardando vínculo';
}

function isRedundantOrganization(org, teams) {
  const modules = (org.modules || []).map((x) => String(x).toUpperCase());
  const onlyTeamPortal = modules.length > 0 && modules.every((x) => x === 'TEAM_PORTAL');
  const teamMatch = teams.some((team) => team.organizationId === org.id || team.organizationName === org.name);
  return (org.accessMode === 'TEAM_PORTAL' || String(org.role).toUpperCase() === 'TEAM_REPRESENTATIVE') && onlyTeamPortal && teamMatch;
}

function metricLabel(total) {
  return total === 1 ? 'acesso liberado' : 'acessos liberados';
}

function hasStatsBackoffice(modules = []) {
  const allowed = new Set(['MANAGEMENT', 'FINANCE_VIEW', 'FINANCE_MANAGE']);
  return (modules || []).some((code) => allowed.has(String(code).toUpperCase()));
}

function roleLabel(role){return {OWNER:'Responsável',ADMIN:'Administrador',VIEWER:'Consulta',COMPETITION_MANAGER:'Gestor da competição',MANAGER:'Gestor',TEAM_REPRESENTATIVE:'Representante',REPRESENTATIVE:'Representante'}[String(role||'').toUpperCase()]||role||'Acesso institucional'}

function OperationalButtons({item}) {
 const modules=(item.modules||[]).map(code=>String(code).toUpperCase());
 const organizationId=item.organizationId||item.id;
 return <>{modules.includes('TRANSMISSION')&&<Link className="btn primary" href={`/transmissao/?organizationId=${encodeURIComponent(organizationId)}`}>Abrir transmissão</Link>}{modules.includes('ARBITRATION')&&<Link className="btn" href="/arbitragem/">Abrir arbitragem</Link>}{modules.includes('MESA')&&<a className="btn" href="https://stats.liga3colinas.com.br/login" target="_blank" rel="noreferrer">Abrir operação de mesa</a>}</>;
}

function teamBadge(name = '') {
  const clean = String(name || 'EQ').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 3).toUpperCase() || 'EQ';
}

export const metadata = { title: 'Central de Acesso | Liga 3 Colinas' };

export default async function MinhaConta({ searchParams }) {
  const sp = await searchParams;
  const jar = await cookies();
  const token = jar.get('l3c_session')?.value;
  if (!token) redirect('/entrar/');

  const data = await authFetch('/auth/me/accesses', token);
  if (!data) redirect('/entrar/');

  const athletePortal = await authFetch('/athlete-portal/me', token);
  const athlete = athletePortal && !athletePortal.error && !athletePortal.message ? athletePortal : null;

  const user = data.user || {};
  const teams = data.teams || [];
  const competitions = data.competitions || [];
  const officials = data.officials || [];
  const organizations = (data.organizations || []).filter((org) => !isRedundantOrganization(org, teams));
  const waiting = sp?.aguardando === '1' || (!athlete && !organizations.length && !competitions.length && !teams.length && !officials.length);
  const totalAccesses = teams.length + organizations.length + competitions.length + officials.length + (athlete ? 1 : 0);

  const notices = [];
  // Inscrição de arbitragem é separada e exige ausência de vínculo com qualquer equipe.

  if (!athlete) {
    notices.push({
      title: 'Portal do Atleta não identificado',
      text: 'Se esta conta também representa um atleta, o vínculo esportivo ainda não foi localizado neste login. A conta continua ativa normalmente para os demais acessos.',
      tone: 'warning',
    });
  }
  notices.push({
    title: 'Vínculos controlados pelo Master',
    text: 'Os acessos exibidos aqui seguem exatamente as permissões liberadas pelo L3C Stats Master para esta conta.',
    tone: 'info',
  });
  if (teams.length) {
    notices.push({
      title: 'Portal da equipe disponível',
      text: 'Os representantes da franquia conseguem acompanhar o portal da equipe sem acessar o painel administrativo completo do L3C Stats.',
      tone: 'success',
    });
  }

  return <main id="central-inicio" className="l3c-central-page l3c-central-with-mobile">
    <section className="l3c-central-hero">
      <div className="shell l3c-central-hero-shell">
        <div className="l3c-central-topbar">
          <div className="l3c-central-brand">
            <div className="l3c-central-brand-mark"><img src="/l3c-logo-oficial.png" alt="Logo oficial da Liga 3 Colinas"/></div>
            <div className="l3c-central-brand-text">
              <strong>Liga 3 Colinas</strong>
              <span>Basquete</span>
            </div>
            <div className="l3c-central-brand-divider" />
            <div className="l3c-central-brand-page">
              <strong>Central de Acesso</strong>
              <span>Minha conta</span>
            </div>
          </div>

          <div className="l3c-central-actions">
            <div className="l3c-central-user-pill">
              <div className="l3c-central-avatar">{initials(user.name)}</div>
              <div className="l3c-central-user-meta">
                <strong>{user.name || 'Usuário L3C Stats'}</strong>
                <span>{user.email || 'Conta autenticada'}</span>
                <small>{roleSummary({ athlete, teams, organizations, competitions, officials })}</small>
              </div>
            </div>
            <form action="/api/session/logout" method="post">
              <button className="l3c-central-logout" type="submit">Sair</button>
            </form>
          </div>
        </div>

        <div className="l3c-central-mini-heading">
          <div><small>Bem-vindo(a) de volta</small><h1>Meus acessos <span>L3C</span></h1></div>
          <p>{totalAccesses} {metricLabel(totalAccesses)} · Os acessos operacionais ficam aqui; o L3C Stats é reservado ao backoffice administrativo e financeiro.</p>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="shell l3c-central-shell">
        <div className="l3c-central-section-head">
          <div>
            <h2>Meus acessos</h2>
            <p className="section-subtitle">Selecione um dos ambientes abaixo para continuar. Cada acesso possui funcionalidades específicas.</p>
          </div>
        </div>

        {waiting && <div className="l3c-central-banner">Sua conta entrou corretamente, mas ainda está aguardando vínculo do administrador da Liga.</div>}

        <div id="central-acessos" className="l3c-central-grid">
          {teams.map((item) => <article className="l3c-central-card" key={`team-${item.id}`}>
            <small>Portal da equipe</small>
            <div className="l3c-central-card-head">
              <div className="l3c-central-emblem team">{item.teamLogoUrl ? <img src={item.teamLogoUrl} alt={`Escudo de ${item.teamName || item.franchiseName || 'equipe'}`}/> : <span aria-hidden="true">♜</span>}</div>
              <div>
                <h3>{item.teamName || item.franchiseName || 'Franquia'}</h3>
                <p>{item.organizationName}{item.competitionName ? ` · ${item.competitionName}` : ''}{item.seasonName ? ` · ${item.seasonName}` : ''}</p>
              </div>
            </div>
            <div className="l3c-central-tags">
              <span>Portal da Equipe</span>
              <span>{item.role || 'REPRESENTANTE'}</span>
            </div>
            <div className="l3c-central-meta-grid">
              <div><small>Vínculo</small><strong>Equipe</strong></div>
              <div><small>Função</small><strong>{roleLabel(item.role)}</strong></div>
            </div>
            <Link className="btn primary" href={`/painel-equipe/?accessId=${encodeURIComponent(item.id)}${item.seasonId?`&seasonId=${encodeURIComponent(item.seasonId)}`:''}`}>Abrir portal</Link>
          </article>)}

          {organizations.map((item) => <article className="l3c-central-card institutional" key={`organization-${item.id}`}>
            <small>Organização</small>
            <div className="l3c-central-card-head">
              <div className="l3c-central-emblem org"><span aria-hidden="true">◆</span></div>
              <div>
                <h3>{item.name}</h3>
                <p>{roleLabel(item.role)}</p>
              </div>
            </div>
            <div className="l3c-central-tags">{(item.modules || []).map((code) => <span key={code}>{moduleLabel(code)}</span>)}</div>
            <div className="l3c-central-meta-grid">
              <div><small>Vínculo</small><strong>Organização</strong></div>
              <div><small>Função</small><strong>{item.role || 'Gestão'}</strong></div>
            </div>
            {hasStatsBackoffice(item.modules) ? <a className="btn" href="https://stats.liga3colinas.com.br/login" target="_blank" rel="noreferrer">Abrir backoffice L3C Stats</a> : <OperationalButtons item={item}/>}
          </article>)}

          {athlete && <article className="l3c-central-card athlete-card" key="athlete-access">
            <small>Portal do atleta</small>
            <div className="l3c-central-card-head">
              <div className="l3c-central-emblem athlete">{athlete.person?.photoUrl ? <img src={athlete.person.photoUrl} alt={`Foto de ${athlete.person.fullName || 'atleta'}`}/> : <span aria-hidden="true">♙</span>}</div>
              <div>
                <h3>{athlete.person?.displayName || athlete.person?.fullName || user.name || 'Atleta'}</h3>
                <p>{athlete.current?.team?.name || 'Sem equipe ativa'}{athlete.current?.season?.competition?.name ? ` · ${athlete.current.season.competition.name}` : ''}</p>
              </div>
            </div>
            <div className="l3c-central-tags">
              <span>Atleta</span>
              {athlete.current?.season?.competition?.name && <span>{athlete.current.season.competition.name}</span>}
              {athlete.credential?.status && <span>{athlete.credential.status}</span>}
            </div>
            <div className="l3c-central-meta-grid">
              <div><small>Vínculo</small><strong>Atleta</strong></div>
              <div><small>Função</small><strong>Jogador</strong></div>
            </div>
            <Link className="btn primary" href="/atleta/">Abrir portal do atleta</Link>
          </article>}

          {!athlete && !teams.length && !officials.length && <article className="l3c-central-card" key="official-enrollment">
            <small>Inscrição de árbitros e mesários</small>
            <div className="l3c-central-card-head"><div className="l3c-central-emblem official">AR</div><div><h3>Solicitar cadastro na arbitragem</h3><p>Exclusivo para quem não possui vínculo como atleta, comissão técnica ou representante de nenhuma equipe.</p></div></div>
            <Link className="btn" href="/cadastro/?perfil=arbitragem">Solicitar inscrição</Link>
          </article>}

          {officials.map((item) => <article className="l3c-central-card" key={`official-${item.id}`}>
            <small>Arbitragem</small>
            <div className="l3c-central-card-head">
              <div className="l3c-central-emblem official">AR</div>
              <div>
                <h3>{item.organizationName || 'Liga 3 Colinas'}</h3>
                <p>Perfil: {item.category || 'Oficial'} · Status: {item.status || 'PENDING'}</p>
              </div>
            </div>
            <div className="l3c-central-tags">
              <span>ARBITRATION</span>
              {item.role && <span>{item.role}</span>}
            </div>
            <div className="l3c-central-meta-grid">
              <div><small>Vínculo</small><strong>Arbitragem</strong></div>
              <div><small>Função</small><strong>{item.category || 'Oficial'}</strong></div>
            </div>
            <Link className="btn primary" href="/arbitragem/">Abrir Área da Arbitragem</Link>
          </article>)}

          {competitions.map((item) => <article className="l3c-central-card" key={`competition-${item.id}`}>
            <small>Campeonato</small>
            <div className="l3c-central-card-head">
              <div className="l3c-central-emblem competition">CP</div>
              <div>
                <h3>{item.name}</h3>
                <p>{item.organizationName || 'Liga 3 Colinas'} · {item.role || 'Acesso vinculado'}</p>
              </div>
            </div>
            <div className="l3c-central-tags">{(item.modules || []).map((code) => <span key={code}>{moduleLabel(code)}</span>)}</div>
            <div className="l3c-central-meta-grid">
              <div><small>Vínculo</small><strong>Campeonato</strong></div>
              <div><small>Função</small><strong>{item.role || 'Acesso'}</strong></div>
            </div>
            {hasStatsBackoffice(item.modules) ? <a className="btn" href="https://stats.liga3colinas.com.br/login" target="_blank" rel="noreferrer">Abrir backoffice L3C Stats</a> : <OperationalButtons item={item}/>}
          </article>)}

          {waiting && !athlete && !teams.length && !officials.length && !organizations.length && !competitions.length && <article className="l3c-central-card waiting-only">
            <small>Aguardando vínculo</small>
            <h3>Sem acessos liberados ainda</h3>
            <p>Quando o administrador vincular sua conta, os acessos aparecerão aqui automaticamente.</p>
            <div className="l3c-central-tags"><span>MASTER</span><span>VÍNCULO PENDENTE</span></div>
            <Link className="btn" href="/entrar/">Voltar</Link>
          </article>}
        </div>

        <div className="l3c-central-notices">
          <div className="l3c-central-notices-title">
            <h2>Avisos e pendências</h2>
            <p className="section-subtitle">Fique atento às informações importantes da Liga 3 Colinas.</p>
          </div>
          <div className="l3c-central-notices-grid">
            {notices.map((notice) => <article key={notice.title} className={`l3c-central-notice ${notice.tone}`}>
              <div className="l3c-central-notice-dot" />
              <div>
                <strong>{notice.title}</strong>
                <p>{notice.text}</p>
              </div>
            </article>)}
          </div>
        </div>
      </div>
    </section>
    <nav className="l3c-central-mobile-bottom" aria-label="Navegação mobile da Central de Acesso">
      <a href="#central-inicio"><span aria-hidden="true">⌂</span><small>Início</small></a>
      <a href="#central-acessos"><span aria-hidden="true">▦</span><small>Acessos</small></a>
      {teams.length>0&&<Link href={`/painel-equipe/?accessId=${encodeURIComponent(teams[0].id)}`}><span aria-hidden="true">♟</span><small>Equipe</small></Link>}
      {athlete&&<Link href="/atleta/"><span aria-hidden="true">▤</span><small>Atleta</small></Link>}
      {!athlete&&officials.length>0&&<Link href="/arbitragem/"><span aria-hidden="true">♧</span><small>Arbitragem</small></Link>}
    </nav>
  </main>;
}
