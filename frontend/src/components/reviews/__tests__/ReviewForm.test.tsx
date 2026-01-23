// ReviewForm.test.tsx (Member 8)
// Tests for ReviewForm component
// Tests form rendering, validation, submission, and edit mode

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ReviewForm from "../ReviewForm";
import * as api from "../../../services/api";

// Mock the API
jest.mock("../../../services/api");

const mockApiPost = api.default.post as jest.MockedFunction<
  typeof api.default.post
>;
const mockApiPut = api.default.put as jest.MockedFunction<
  typeof api.default.put
>;

describe("ReviewForm Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    targetType: "movie" as const,
    targetId: "movie123",
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiPost.mockResolvedValue({ data: { success: true } });
    mockApiPut.mockResolvedValue({ data: { success: true } });
  });

  describe("Form Rendering", () => {
    it("renders form with title", () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText("Write a Review")).toBeInTheDocument();
    });

    it("renders star rating selector", () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText("Your Rating")).toBeInTheDocument();
      // Stars should be interactive buttons
      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      expect(stars).toHaveLength(5);
    });

    it("renders comment textarea", () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/share your experience/i),
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<ReviewForm {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /submit review/i }),
      ).toBeInTheDocument();
    });

    it("renders cancel button when onCancel provided", () => {
      render(<ReviewForm {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it("shows character count for comment", () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText("0/1000 characters")).toBeInTheDocument();
    });
  });

  describe("Rating Validation", () => {
    it("shows error when submitting without rating", async () => {
      render(<ReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Please select a rating")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("submit button is disabled until rating is selected", () => {
      render(<ReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("submit button becomes enabled after rating is selected", async () => {
      render(<ReviewForm {...defaultProps} />);

      // Click on 4th star
      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[3]);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Comment Field", () => {
    it("comment is optional - can submit with rating only", async () => {
      render(<ReviewForm {...defaultProps} />);

      // Select rating
      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[4]); // 5 stars

      // Submit without comment
      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("/api/reviews", {
          targetType: "movie",
          targetId: "movie123",
          rating: 5,
          comment: undefined,
        });
      });
    });

    it("updates character count as user types", async () => {
      const user = userEvent.setup();
      render(<ReviewForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/share your experience/i);
      await user.type(textarea, "Great movie!");

      expect(screen.getByText("12/1000 characters")).toBeInTheDocument();
    });

    it("respects maxLength attribute", () => {
      render(<ReviewForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/share your experience/i);
      expect(textarea).toHaveAttribute("maxLength", "1000");
    });
  });

  describe("Form Submission", () => {
    it("calls API with correct data on submission", async () => {
      render(<ReviewForm {...defaultProps} />);

      // Select rating
      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[3]); // 4 stars

      // Add comment
      const textarea = screen.getByPlaceholderText(/share your experience/i);
      fireEvent.change(textarea, { target: { value: "Great experience!" } });

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("/api/reviews", {
          targetType: "movie",
          targetId: "movie123",
          rating: 4,
          comment: "Great experience!",
        });
      });
    });

    it("calls onSubmit callback after successful submission", async () => {
      render(<ReviewForm {...defaultProps} />);

      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("shows loading state during submission", async () => {
      // Make API call take longer
      mockApiPost.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { success: true } }), 100);
          }),
      );

      render(<ReviewForm {...defaultProps} />);

      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      expect(screen.getByText("Submitting...")).toBeInTheDocument();
    });

    it("disables form inputs during submission", async () => {
      mockApiPost.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { success: true } }), 100);
          }),
      );

      render(<ReviewForm {...defaultProps} />);

      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("API Error Handling", () => {
    it("displays error message when API fails", async () => {
      mockApiPost.mockRejectedValue({
        response: {
          data: {
            error: { message: "You have already reviewed this movie" },
          },
        },
      });

      render(<ReviewForm {...defaultProps} />);

      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/you have already reviewed this movie/i),
        ).toBeInTheDocument();
      });
    });

    it("does not call onSubmit when API fails", async () => {
      mockApiPost.mockRejectedValue(new Error("Network error"));

      render(<ReviewForm {...defaultProps} />);

      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Edit Mode", () => {
    const existingReview = {
      _id: "review123",
      userId: { _id: "user1", firstName: "John", lastName: "Doe" },
      targetType: "movie" as const,
      targetId: "movie123",
      rating: 4,
      comment: "Original comment",
      isVerifiedBooking: true,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    it("shows edit mode title", () => {
      render(<ReviewForm {...defaultProps} existingReview={existingReview} />);

      expect(screen.getByText("Edit Your Review")).toBeInTheDocument();
    });

    it("pre-fills rating from existing review", () => {
      render(<ReviewForm {...defaultProps} existingReview={existingReview} />);

      // Check that 4 stars are filled
      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });
      expect(stars[0]).toHaveClass("text-yellow-400");
      expect(stars[1]).toHaveClass("text-yellow-400");
      expect(stars[2]).toHaveClass("text-yellow-400");
      expect(stars[3]).toHaveClass("text-yellow-400");
      expect(stars[4]).toHaveClass("text-gray-300");
    });

    it("pre-fills comment from existing review", () => {
      render(<ReviewForm {...defaultProps} existingReview={existingReview} />);

      const textarea = screen.getByPlaceholderText(/share your experience/i);
      expect(textarea).toHaveValue("Original comment");
    });

    it("shows Update Review button in edit mode", () => {
      render(<ReviewForm {...defaultProps} existingReview={existingReview} />);

      expect(
        screen.getByRole("button", { name: /update review/i }),
      ).toBeInTheDocument();
    });

    it("calls PUT API in edit mode", async () => {
      render(<ReviewForm {...defaultProps} existingReview={existingReview} />);

      const submitButton = screen.getByRole("button", {
        name: /update review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPut).toHaveBeenCalledWith("/api/reviews/review123", {
          rating: 4,
          comment: "Original comment",
        });
      });
    });

    it("shows verified booking indicator when user has booking", () => {
      render(<ReviewForm {...defaultProps} existingReview={existingReview} />);

      expect(screen.getByText("Verified Booking")).toBeInTheDocument();
    });
  });

  describe("Cancel Button", () => {
    it("calls onCancel when cancel button is clicked", () => {
      render(<ReviewForm {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Rating Labels", () => {
    it("shows rating label when rating is selected", () => {
      render(<ReviewForm {...defaultProps} />);

      const stars = screen.getAllByRole("button", { name: /rate \d stars/i });

      fireEvent.click(stars[0]);
      expect(screen.getByText("Poor")).toBeInTheDocument();

      fireEvent.click(stars[1]);
      expect(screen.getByText("Fair")).toBeInTheDocument();

      fireEvent.click(stars[2]);
      expect(screen.getByText("Good")).toBeInTheDocument();

      fireEvent.click(stars[3]);
      expect(screen.getByText("Very Good")).toBeInTheDocument();

      fireEvent.click(stars[4]);
      expect(screen.getByText("Excellent")).toBeInTheDocument();
    });
  });
});
