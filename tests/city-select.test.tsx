import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CitySelect } from '../src/components/CitySelect';
vi.mock('../src/services/geography', () => ({
  getStates: vi.fn(async () => [{ id: 35, nome: 'São Paulo', sigla: 'SP' }, { id: 33, nome: 'Rio de Janeiro', sigla: 'RJ' }]),
  getCities: vi.fn(async () => [{ id: 1, nome: 'São Paulo' }, { id: 2, nome: 'Campinas' }]),
}));
afterEach(cleanup);
it('filtra cidades sem exigir acentos e mantém seleção por ID', async () => {
  const onChange = vi.fn();
  render(<CitySelect label="Origem" value={{ uf: 'SP', cityId: 0, name: '' }} onChange={onChange} />);
  await screen.findByRole('option', { name: 'Campinas' });
  fireEvent.change(screen.getByLabelText('Origem — buscar cidade'), { target: { value: 'sao' } });
  expect(screen.queryByRole('option', { name: 'Campinas' })).toBeNull();
  expect(screen.getByRole('option', { name: 'São Paulo' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Origem — cidade'), { target: { value: '1' } });
  expect(onChange).toHaveBeenCalledWith({ uf: 'SP', cityId: 1, name: 'São Paulo' });
  fireEvent.change(screen.getByLabelText('Origem — UF'), { target: { value: 'RJ' } });
  await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ uf: 'RJ', cityId: 0, name: '' }));
});
