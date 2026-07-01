import { render, screen } from '@testing-library/react';
import App from './App';

test('renders resume analyzer dashboard', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /resume analyzer/i })).toBeInTheDocument();
  expect(screen.getByText(/smart ats insights and job matching/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
  expect(screen.getByText(/login to upload resumes/i)).toBeInTheDocument();
});
