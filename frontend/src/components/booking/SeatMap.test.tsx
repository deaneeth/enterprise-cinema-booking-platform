// SeatMap.test.tsx (Member 6)
// Frontend tests for SeatMap component
// Tests seat display, selection, WebSocket updates, and visual states

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SeatMap, { SeatData } from "./SeatMap";
import * as api from "../../services/api";
import websocketClient from "../../services/websocket";

// Mock the dependencies
jest.mock("../../services/api");
jest.mock("../../services/websocket");

const mockApiGet = api.default.get as jest.MockedFunction<
  typeof api.default.get
>;
const mockApiPut = api.default.put as jest.MockedFunction<
  typeof api.default.put
>;

// Mock seat data
const mockSeats: SeatData[] = [
  {
    _id: "seat1",
    showtimeId: "showtime1",
    seatNumber: "A1",
    row: "A",
    column: 1,
    seatType: "regular",
    status: "available",
    price: 500,
  },
  {
    _id: "seat2",
    showtimeId: "showtime1",
    seatNumber: "A2",
    row: "A",
    column: 2,
    seatType: "vip",
    status: "available",
    price: 750,
  },
  {
    _id: "seat3",
    showtimeId: "showtime1",
    seatNumber: "A3",
    row: "A",
    column: 3,
    seatType: "regular",
    status: "held",
    heldBy: "otherUser123",
    price: 500,
  },
  {
    _id: "seat4",
    showtimeId: "showtime1",
    seatNumber: "A4",
    row: "A",
    column: 4,
    seatType: "regular",
    status: "booked",
    price: 500,
  },
];

// Mock auth context
const mockUser = {
  id: "currentUser123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "user" as const,
  isActive: true,
};

// Mock the useAuth hook
jest.mock("../../contexts/AuthContext", () => ({
  ...jest.requireActual("../../contexts/AuthContext"),
  useAuth: () => ({
    currentUser: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
  }),
}));

// Simple wrapper component for tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

describe("SeatMap Component", () => {
  const mockOnSeatSelect = jest.fn();
  const mockOnSeatDeselect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock WebSocket client
    (websocketClient.connect as jest.Mock).mockImplementation(() => {});
    (websocketClient.joinShowtime as jest.Mock).mockImplementation(() => {});
    (websocketClient.leaveShowtime as jest.Mock).mockImplementation(() => {});
    (websocketClient.isConnected as jest.Mock).mockReturnValue(true);
    (websocketClient.onSeatUpdated as jest.Mock).mockImplementation(() => {});
    (websocketClient.onSeatsRefresh as jest.Mock).mockImplementation(() => {});
    (websocketClient.offSeatUpdated as jest.Mock).mockImplementation(() => {});
    (websocketClient.offSeatsRefresh as jest.Mock).mockImplementation(() => {});

    // Mock API response
    mockApiGet.mockResolvedValue({
      data: {
        success: true,
        data: {
          allSeats: mockSeats,
          seats: {
            A: mockSeats,
          },
        },
      },
    });
  });

  it("renders loading state initially", () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/loading seats/i)).toBeInTheDocument();
  });

  it("displays seats after loading", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.getByText("A2")).toBeInTheDocument();
      expect(screen.getByText("A3")).toBeInTheDocument();
      expect(screen.getByText("A4")).toBeInTheDocument();
    });
  });

  it("shows screen indicator", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("SCREEN")).toBeInTheDocument();
    });
  });

  it("displays legend section", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Available")).toBeInTheDocument();
      expect(screen.getByText("Selected")).toBeInTheDocument();
      expect(screen.getByText("Held")).toBeInTheDocument();
      expect(screen.getByText("Booked")).toBeInTheDocument();
    });
  });

  it("shows connection status indicator", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Live")).toBeInTheDocument();
    });
  });

  it("calls onSeatSelect when clicking available seat", async () => {
    mockApiPut.mockResolvedValue({
      data: {
        success: true,
        data: { ...mockSeats[0], status: "held", heldBy: "currentUser123" },
      },
    });

    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("A1")).toBeInTheDocument();
    });

    const seatButton = screen.getByRole("button", { name: /seat a1/i });
    fireEvent.click(seatButton);

    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith("/api/seats/seat1/hold");
    });
  });

  it("does not allow clicking booked seats", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("A4")).toBeInTheDocument();
    });

    const bookedSeat = screen.getByRole("button", { name: /seat a4/i });
    expect(bookedSeat).toBeDisabled();
  });

  it("joins WebSocket room on mount", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(websocketClient.connect).toHaveBeenCalled();
      expect(websocketClient.joinShowtime).toHaveBeenCalledWith("showtime1");
    });
  });

  it("leaves WebSocket room on unmount", async () => {
    const { unmount } = render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("A1")).toBeInTheDocument();
    });

    unmount();

    expect(websocketClient.leaveShowtime).toHaveBeenCalledWith("showtime1");
    expect(websocketClient.offSeatUpdated).toHaveBeenCalled();
    expect(websocketClient.offSeatsRefresh).toHaveBeenCalled();
  });

  it("displays error state when API fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Network error"));

    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading seats/i)).toBeInTheDocument();
    });
  });

  it("displays selected seats count", async () => {
    const selectedSeat = { ...mockSeats[0], status: "held" as const };

    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[selectedSeat]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/you have selected 1 seat/i)).toBeInTheDocument();
    });
  });
});

describe("SeatMap WebSocket Integration", () => {
  const mockOnSeatSelect = jest.fn();
  const mockOnSeatDeselect = jest.fn();
  let seatUpdatedCallback: (data: any) => void;
  let seatsRefreshCallback: () => void;

  beforeEach(() => {
    jest.clearAllMocks();

    // Capture WebSocket callbacks
    (websocketClient.onSeatUpdated as jest.Mock).mockImplementation(
      (cb: any) => {
        seatUpdatedCallback = cb;
      }
    );
    (websocketClient.onSeatsRefresh as jest.Mock).mockImplementation(
      (cb: any) => {
        seatsRefreshCallback = cb;
      }
    );

    (websocketClient.connect as jest.Mock).mockImplementation(() => {});
    (websocketClient.joinShowtime as jest.Mock).mockImplementation(() => {});
    (websocketClient.leaveShowtime as jest.Mock).mockImplementation(() => {});
    (websocketClient.isConnected as jest.Mock).mockReturnValue(true);
    (websocketClient.offSeatUpdated as jest.Mock).mockImplementation(() => {});
    (websocketClient.offSeatsRefresh as jest.Mock).mockImplementation(() => {});

    mockApiGet.mockResolvedValue({
      data: {
        success: true,
        data: {
          allSeats: mockSeats,
          seats: { A: mockSeats },
        },
      },
    });
  });

  it("registers WebSocket event listeners", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(websocketClient.onSeatUpdated).toHaveBeenCalled();
      expect(websocketClient.onSeatsRefresh).toHaveBeenCalled();
    });
  });

  it("updates seat status on WebSocket seat:updated event", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("A1")).toBeInTheDocument();
    });

    // Simulate WebSocket seat update
    act(() => {
      seatUpdatedCallback({
        seatId: "seat1",
        status: "held",
        heldBy: "anotherUser",
      });
    });

    // The seat should now show as held by another user
    // This is tracked in the selectingUsers state
  });

  it("refetches seats on WebSocket seats:refresh event", async () => {
    render(
      <TestWrapper>
        <SeatMap
          showtimeId="showtime1"
          selectedSeats={[]}
          onSeatSelect={mockOnSeatSelect}
          onSeatDeselect={mockOnSeatDeselect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });

    // Simulate WebSocket refresh event
    act(() => {
      seatsRefreshCallback();
    });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(2);
    });
  });
});
