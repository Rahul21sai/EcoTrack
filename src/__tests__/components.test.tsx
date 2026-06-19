import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { ComparisonResult, Recommendation } from '../types';

import AuthGate from '../components/AuthGate';
import StreakBadge from '../components/StreakBadge';
import ComparisonCard from '../components/ComparisonCard';
import RecommendationCard from '../components/RecommendationCard';
import RecommendationList from '../components/RecommendationList';
import LogEntryForm from '../components/LogEntryForm';

// Mock Recharts to avoid JSDOM layout rendering issues
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    LineChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Line: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Cell: () => <div />,
    Legend: () => <div />,
  };
});

// Mock hooks
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
let mockUser: User | null = null;
let mockLoading = false;
let mockAuthError: string | null = null;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    error: mockAuthError,
    signIn: mockSignIn,
    signOut: mockSignOut,
  }),
}));

describe('AuthGate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockLoading = false;
    mockAuthError = null;
  });

  it('renders loading spinner when loading is true', () => {
    mockLoading = true;
    render(
      <AuthGate>
        <div data-testid="child">Authenticated Content</div>
      </AuthGate>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders sign-in screen when user is null', () => {
    render(
      <AuthGate>
        <div data-testid="child">Authenticated Content</div>
      </AuthGate>
    );
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('displays auth error message when present', () => {
    mockAuthError = 'Failed to authenticate';
    render(
      <AuthGate>
        <div data-testid="child">Authenticated Content</div>
      </AuthGate>
    );
    expect(screen.getByText('Failed to authenticate')).toBeInTheDocument();
  });

  it('calls signIn when the sign-in button is clicked', () => {
    render(
      <AuthGate>
        <div data-testid="child">Authenticated Content</div>
      </AuthGate>
    );
    const button = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(button);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('renders children when user is authenticated', () => {
    mockUser = { uid: '123', email: 'test@example.com' } as User;
    render(
      <AuthGate>
        <div data-testid="child">Authenticated Content</div>
      </AuthGate>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
    expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
  });
});

describe('StreakBadge Component', () => {
  it('renders zero state prompt when streak is 0', () => {
    render(<StreakBadge streak={0} />);
    expect(screen.getByText(/start a streak/i)).toBeInTheDocument();
  });

  it('renders active streak count when streak is positive', () => {
    render(<StreakBadge streak={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('day streak')).toBeInTheDocument();
    expect(screen.queryByText(/Consistency milestone/i)).not.toBeInTheDocument();
  });

  it('renders congratulatory message when streak is 7 or more', () => {
    render(<StreakBadge streak={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/Consistency milestone/i)).toBeInTheDocument();
  });
});

describe('ComparisonCard Component', () => {
  it('renders below national average comparison correctly', () => {
    const mockComparison: ComparisonResult = {
      status: 'below',
      userDaily: 8.5,
      nationalAverage: 12.0,
      country: 'USA',
      percentageDifference: -29.17,
    };
    render(<ComparisonCard comparison={mockComparison} />);
    expect(screen.getByText(/Below average/i)).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('8.5 kg')).toBeInTheDocument();
    expect(screen.getByText('USA Avg')).toBeInTheDocument();
    expect(screen.getByText('12.0 kg')).toBeInTheDocument();
    expect(screen.getByText(/-29.2% vs national average/i)).toBeInTheDocument();
  });

  it('renders above national average comparison correctly', () => {
    const mockComparison: ComparisonResult = {
      status: 'above',
      userDaily: 15.0,
      nationalAverage: 12.0,
      country: 'USA',
      percentageDifference: 25.0,
    };
    render(<ComparisonCard comparison={mockComparison} />);
    expect(screen.getByText(/Above average/i)).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('15.0 kg')).toBeInTheDocument();
    expect(screen.getByText('USA Avg')).toBeInTheDocument();
    expect(screen.getByText('12.0 kg')).toBeInTheDocument();
    expect(screen.getByText(/\+25.0% vs national average/i)).toBeInTheDocument();
  });
});

describe('Recommendation Components', () => {
  const mockRecommendation: Recommendation = {
    category: 'transport',
    title: 'Walk or Cycle',
    description: 'Replace short car trips with walking or cycling.',
    estimatedSavingsKg: 4.5,
    difficulty: 'easy',
  };

  it('renders RecommendationCard correctly', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    expect(screen.getByText('Walk or Cycle')).toBeInTheDocument();
    expect(screen.getByText(/Replace short car trips/i)).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText(/Save ~4.5 kg CO2e/i)).toBeInTheDocument();
  });

  it('renders RecommendationList empty state', () => {
    render(<RecommendationList recommendations={[]} />);
    expect(screen.getByText(/Keep logging your activities/i)).toBeInTheDocument();
  });

  it('renders RecommendationList with recommendations', () => {
    render(<RecommendationList recommendations={[mockRecommendation]} />);
    expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Walk or Cycle')).toBeInTheDocument();
  });
});

describe('LogEntryForm Component', () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields initially', () => {
    render(<LogEntryForm onSubmit={mockSubmit} />);
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
  });

  it('displays category-specific type selector when category is selected', () => {
    render(<LogEntryForm onSubmit={mockSubmit} />);
    
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'transport' } });

    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
  });

  it('shows validation errors for invalid value input on submit', async () => {
    render(<LogEntryForm onSubmit={mockSubmit} />);
    
    // Select category
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'transport' } });
    
    // Select mode/type
    const typeSelect = screen.getByLabelText(/Type/i);
    fireEvent.change(typeSelect, { target: { value: 'car_petrol' } });

    // Enter invalid non-numeric value
    const valueInput = screen.getByLabelText(/Value/i);
    fireEvent.change(valueInput, { target: { value: 'abc' } });

    // Submit
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Invalid value/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data successfully', async () => {
    mockSubmit.mockResolvedValue(undefined);
    render(<LogEntryForm onSubmit={mockSubmit} />);
    
    // Select category
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'transport' } });
    
    // Select mode/type
    const typeSelect = screen.getByLabelText(/Type/i);
    fireEvent.change(typeSelect, { target: { value: 'car_petrol' } });

    // Enter valid numeric value
    const valueInput = screen.getByLabelText(/Value/i);
    fireEvent.change(valueInput, { target: { value: '100' } });

    // Submit
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
    
    expect(mockSubmit).toHaveBeenCalledWith({
      category: 'transport',
      mode: 'car_petrol',
      value: 100,
      unit: 'km',
      date: new Date().toISOString().split('T')[0],
    });
  });
});
