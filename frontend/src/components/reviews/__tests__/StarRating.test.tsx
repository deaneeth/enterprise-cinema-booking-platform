// StarRating.test.tsx (Member 8)
// Tests for StarRating component
// Tests display, interactive selection, and hover preview

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import StarRating from "../StarRating";

describe("StarRating Component", () => {
  describe("Display Mode (non-interactive)", () => {
    it("renders 5 stars", () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole("presentation");
      expect(stars).toHaveLength(5);
    });

    it("renders correct number of filled stars based on rating", () => {
      render(<StarRating rating={3} />);

      const stars = screen.getAllByRole("presentation");
      // First 3 stars should be filled (yellow), last 2 empty (gray)
      expect(stars[0]).toHaveClass("text-yellow-400");
      expect(stars[1]).toHaveClass("text-yellow-400");
      expect(stars[2]).toHaveClass("text-yellow-400");
      expect(stars[3]).toHaveClass("text-gray-300");
      expect(stars[4]).toHaveClass("text-gray-300");
    });

    it("handles 0 rating correctly", () => {
      render(<StarRating rating={0} />);

      const stars = screen.getAllByRole("presentation");
      stars.forEach((star) => {
        expect(star).toHaveClass("text-gray-300");
      });
    });

    it("handles 5 rating correctly", () => {
      render(<StarRating rating={5} />);

      const stars = screen.getAllByRole("presentation");
      stars.forEach((star) => {
        expect(star).toHaveClass("text-yellow-400");
      });
    });

    it("shows rating value when showValue is true", () => {
      render(<StarRating rating={4.5} showValue />);

      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("shows 0.0 when rating is 0 and showValue is true", () => {
      render(<StarRating rating={0} showValue />);

      expect(screen.getByText("0.0")).toBeInTheDocument();
    });
  });

  describe("Size Prop", () => {
    it("applies small size class", () => {
      render(<StarRating rating={3} size="small" />);

      // Check for the container with size class
      const container = screen.getAllByRole("presentation")[0].parentElement;
      expect(container).toHaveClass("text-sm");
    });

    it("applies medium size class by default", () => {
      render(<StarRating rating={3} />);

      const container = screen.getAllByRole("presentation")[0].parentElement;
      expect(container).toHaveClass("text-xl");
    });

    it("applies large size class", () => {
      render(<StarRating rating={3} size="large" />);

      const container = screen.getAllByRole("presentation")[0].parentElement;
      expect(container).toHaveClass("text-3xl");
    });
  });

  describe("Interactive Mode", () => {
    it("renders stars as buttons when interactive", () => {
      render(<StarRating rating={0} interactive onChange={jest.fn()} />);

      const stars = screen.getAllByRole("button");
      expect(stars).toHaveLength(5);
    });

    it("calls onChange with correct value when clicking star", () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={0} interactive onChange={mockOnChange} />);

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[3]); // Click 4th star

      expect(mockOnChange).toHaveBeenCalledWith(4);
    });

    it("calls onChange with 1 when clicking first star", () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={0} interactive onChange={mockOnChange} />);

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[0]);

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it("calls onChange with 5 when clicking last star", () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={0} interactive onChange={mockOnChange} />);

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it("shows cursor-pointer class when interactive", () => {
      render(<StarRating rating={3} interactive onChange={jest.fn()} />);

      const container = screen.getAllByRole("button")[0].parentElement;
      expect(container).toHaveClass("cursor-pointer");
    });

    it("shows hover preview when hovering over stars", () => {
      render(<StarRating rating={2} interactive onChange={jest.fn()} />);

      const stars = screen.getAllByRole("button");

      // Hover over 4th star - should show 4 filled
      fireEvent.mouseEnter(stars[3]);

      expect(stars[0]).toHaveClass("text-yellow-400");
      expect(stars[1]).toHaveClass("text-yellow-400");
      expect(stars[2]).toHaveClass("text-yellow-400");
      expect(stars[3]).toHaveClass("text-yellow-400");
      expect(stars[4]).toHaveClass("text-gray-300");
    });

    it("resets to original rating on mouse leave", () => {
      render(<StarRating rating={2} interactive onChange={jest.fn()} />);

      const stars = screen.getAllByRole("button");
      const container = stars[0].parentElement;

      // Hover over 4th star
      fireEvent.mouseEnter(stars[3]);

      // Leave the container
      fireEvent.mouseLeave(container!);

      // Should reset to original rating of 2
      expect(stars[0]).toHaveClass("text-yellow-400");
      expect(stars[1]).toHaveClass("text-yellow-400");
      expect(stars[2]).toHaveClass("text-gray-300");
      expect(stars[3]).toHaveClass("text-gray-300");
      expect(stars[4]).toHaveClass("text-gray-300");
    });
  });

  describe("Non-interactive Mode Click Behavior", () => {
    it("does not call onChange when clicking in non-interactive mode", () => {
      const mockOnChange = jest.fn();
      render(<StarRating rating={3} onChange={mockOnChange} />);

      const stars = screen.getAllByRole("presentation");
      fireEvent.click(stars[0]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper aria-labels for interactive stars", () => {
      render(<StarRating rating={3} interactive onChange={jest.fn()} />);

      expect(screen.getByLabelText("Rate 1 stars")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 2 stars")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 3 stars")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 4 stars")).toBeInTheDocument();
      expect(screen.getByLabelText("Rate 5 stars")).toBeInTheDocument();
    });

    it("has proper aria-labels for non-interactive stars", () => {
      render(<StarRating rating={3} />);

      expect(screen.getByLabelText("1 star")).toBeInTheDocument();
      expect(screen.getByLabelText("2 star")).toBeInTheDocument();
      expect(screen.getByLabelText("3 star")).toBeInTheDocument();
      expect(screen.getByLabelText("4 star")).toBeInTheDocument();
      expect(screen.getByLabelText("5 star")).toBeInTheDocument();
    });
  });
});
