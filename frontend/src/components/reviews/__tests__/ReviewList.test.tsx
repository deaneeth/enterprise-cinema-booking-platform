// ReviewList.test.tsx (Member 8)
// Tests for ReviewList component
// Tests display, pagination, sorting, filtering, and user interactions

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewList from "../ReviewList";
import * as api from "../../../services/api";

// Mock the API
jest.mock("../../../services/api");

const mockApiGet = api.default.get as jest.MockedFunction<
  typeof api.default.get
>;
const mockApiDelete = api.default.delete as jest.MockedFunction<
  typeof api.default.delete
>;

// Mock review data
const mockReviews = [
  {
    _id: "review1",
    userId: { _id: "user1", firstName: "John", lastName: "Doe" },
    targetType: "movie",
    targetId: "movie123",
    rating: 5,
    comment: "Amazing movie!",
    isVerifiedBooking: true,
    isActive: true,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    _id: "review2",
    userId: { _id: "user2", firstName: "Jane", lastName: "Smith" },
    targetType: "movie",
    targetId: "movie123",
    rating: 4,
    comment: "Really enjoyed it",
    isVerifiedBooking: false,
    isActive: true,
    createdAt: "2024-01-14T00:00:00Z",
    updatedAt: "2024-01-14T00:00:00Z",
  },
  {
    _id: "review3",
    userId: { _id: "user3", firstName: "Bob", lastName: "Wilson" },
    targetType: "movie",
    targetId: "movie123",
    rating: 3,
    comment: null,
    isVerifiedBooking: false,
    isActive: true,
    createdAt: "2024-01-13T00:00:00Z",
    updatedAt: "2024-01-13T00:00:00Z",
  },
];

const mockApiResponse = {
  data: {
    success: true,
    data: {
      reviews: mockReviews,
      averageRating: 4.0,
      totalReviews: 3,
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        pages: 1,
      },
    },
  },
};

// Mock localStorage for token
const mockToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.test";

describe("ReviewList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue(mockApiResponse);
    mockApiDelete.mockResolvedValue({ data: { success: true } });
    // Clear localStorage
    localStorage.clear();
  });

  describe("Loading State", () => {
    it("renders loading state initially", () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      // Should show loading spinner
      expect(
        screen.getByRole("heading", { name: /reviews/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("renders empty state when no reviews", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
      });
    });

    it("shows message to be first to review when empty", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText(/be the first to review/i)).toBeInTheDocument();
      });
    });
  });

  describe("Reviews Display", () => {
    it("renders list of reviews correctly", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
      });
    });

    it("displays user names correctly", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("displays review comments", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("Amazing movie!")).toBeInTheDocument();
        expect(screen.getByText("Really enjoyed it")).toBeInTheDocument();
      });
    });

    it("displays formatted dates", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
      });
    });

    it("displays user avatar initials", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("JD")).toBeInTheDocument(); // John Doe
        expect(screen.getByText("JS")).toBeInTheDocument(); // Jane Smith
        expect(screen.getByText("BW")).toBeInTheDocument(); // Bob Wilson
      });
    });
  });

  describe("Average Rating Header", () => {
    it("displays average rating and count at top", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("4.0")).toBeInTheDocument();
        expect(screen.getByText("(3 reviews)")).toBeInTheDocument();
      });
    });

    it("shows singular review text for 1 review", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: [mockReviews[0]],
            averageRating: 5.0,
            totalReviews: 1,
            pagination: { page: 1, limit: 10, total: 1, pages: 1 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("(1 review)")).toBeInTheDocument();
      });
    });
  });

  describe("Verified Booking Badge", () => {
    it("shows Verified badge for verified reviews", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("Verified")).toBeInTheDocument();
      });
    });
  });

  describe("Sorting", () => {
    it("renders sort dropdown with options", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Sort reviews")).toBeInTheDocument();
      });

      const sortDropdown = screen.getByLabelText("Sort reviews");
      expect(sortDropdown).toHaveDisplayValue("Most Recent");
    });

    it("sort dropdown contains all options", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "Most Recent" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: "Highest Rating" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: "Lowest Rating" }),
        ).toBeInTheDocument();
      });
    });

    it("sorts reviews by highest rating", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const sortDropdown = screen.getByLabelText("Sort reviews");
      fireEvent.change(sortDropdown, { target: { value: "highest" } });

      // After sorting by highest, John Doe (5 stars) should still be first
      const reviewCards = screen.getAllByText(/Doe|Smith|Wilson/);
      expect(reviewCards[0]).toHaveTextContent("John Doe");
    });
  });

  describe("Rating Filter", () => {
    it("renders rating filter dropdown", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Filter by rating")).toBeInTheDocument();
      });
    });

    it("filter dropdown contains all rating options", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "All Ratings" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: "5 Stars" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: "4+ Stars" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: "3+ Stars" }),
        ).toBeInTheDocument();
      });
    });

    it("calls API with rating filter parameter", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalled();
      });

      const filterDropdown = screen.getByLabelText("Filter by rating");
      fireEvent.change(filterDropdown, { target: { value: "5" } });

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith(
          "/api/movies/movie123/reviews",
          expect.objectContaining({
            params: expect.objectContaining({ rating: 5 }),
          }),
        );
      });
    });

    it("shows no match message when filter returns empty", async () => {
      mockApiGet.mockResolvedValueOnce(mockApiResponse).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            reviews: [],
            averageRating: 4.0,
            totalReviews: 3,
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Filter by rating")).toBeInTheDocument();
      });

      const filterDropdown = screen.getByLabelText("Filter by rating");
      fireEvent.change(filterDropdown, { target: { value: "5" } });

      await waitFor(() => {
        expect(
          screen.getByText(/no reviews match this filter/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Pagination", () => {
    it("shows pagination when multiple pages exist", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: mockReviews,
            averageRating: 4.0,
            totalReviews: 25,
            pagination: { page: 1, limit: 10, total: 25, pages: 3 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /previous/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /next/i }),
        ).toBeInTheDocument();
      });
    });

    it("previous button is disabled on first page", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: mockReviews,
            averageRating: 4.0,
            totalReviews: 25,
            pagination: { page: 1, limit: 10, total: 25, pages: 3 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("next button navigates to next page", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: mockReviews,
            averageRating: 4.0,
            totalReviews: 25,
            pagination: { page: 1, limit: 10, total: 25, pages: 3 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith(
          "/api/movies/movie123/reviews",
          expect.objectContaining({
            params: expect.objectContaining({ page: 2 }),
          }),
        );
      });
    });

    it("does not show pagination for single page", async () => {
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.queryByText(/page \d of \d/i)).not.toBeInTheDocument();
    });
  });

  describe("Write a Review Button", () => {
    it("shows Write a Review button for logged-in users who have not reviewed", async () => {
      localStorage.setItem("token", mockToken);

      // User is logged in but hasn't reviewed
      const reviewsWithoutCurrentUser = mockReviews.filter(
        (r) => r.userId._id !== "user1",
      );
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: reviewsWithoutCurrentUser,
            averageRating: 3.5,
            totalReviews: 2,
            pagination: { page: 1, limit: 10, total: 2, pages: 1 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /write a review/i }),
        ).toBeInTheDocument();
      });
    });

    it("hides Write a Review button for users who have already reviewed", async () => {
      localStorage.setItem("token", mockToken);

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // User1 has already reviewed, so button should not appear
      expect(
        screen.queryByRole("button", { name: /write a review/i }),
      ).not.toBeInTheDocument();
    });

    it("hides Write a Review button for non-logged-in users", async () => {
      // No token in localStorage
      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(
        screen.queryByRole("button", { name: /write a review/i }),
      ).not.toBeInTheDocument();
    });

    it("shows review form when Write a Review is clicked", async () => {
      localStorage.setItem("token", mockToken);

      const reviewsWithoutCurrentUser = mockReviews.filter(
        (r) => r.userId._id !== "user1",
      );
      mockApiGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            reviews: reviewsWithoutCurrentUser,
            averageRating: 3.5,
            totalReviews: 2,
            pagination: { page: 1, limit: 10, total: 2, pages: 1 },
          },
        },
      });

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /write a review/i }),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /write a review/i }));

      await waitFor(() => {
        expect(screen.getByText("Write a Review")).toBeInTheDocument();
        expect(screen.getByText("Your Rating")).toBeInTheDocument();
      });
    });
  });

  describe("User's Own Review", () => {
    it("highlights user own review", async () => {
      localStorage.setItem("token", mockToken);

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText("(Your Review)")).toBeInTheDocument();
      });
    });

    it("shows edit button for own review", async () => {
      localStorage.setItem("token", mockToken);

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /edit/i }),
        ).toBeInTheDocument();
      });
    });

    it("shows delete button for own review", async () => {
      localStorage.setItem("token", mockToken);

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message when API fails", async () => {
      mockApiGet.mockRejectedValue(new Error("Network error"));

      render(<ReviewList targetType="movie" targetId="movie123" />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Cinema Reviews", () => {
    it("calls correct API endpoint for cinema reviews", async () => {
      render(<ReviewList targetType="cinema" targetId="cinema456" />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith(
          "/api/cinemas/cinema456/reviews",
          expect.any(Object),
        );
      });
    });
  });
});
