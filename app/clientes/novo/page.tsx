import { redirect } from 'next/navigation';

export default function NovoCliente() {
  redirect('/clientes/new/edit');
}
