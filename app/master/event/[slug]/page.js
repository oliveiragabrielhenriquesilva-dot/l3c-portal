import EventPage from '../../../event/[slug]/page';

// Página de jogo da Liga Master: mesmo conteúdo da página de jogo, com o cabeçalho e a identidade do Master.
export default async function MasterEventPage(props) {
  return EventPage({ ...props, viaMaster: true });
}
