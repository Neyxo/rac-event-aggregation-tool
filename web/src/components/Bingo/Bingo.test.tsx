// Event bingo: a line wins, three in a row do not; the card survives closing the popup.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Bingo, { won } from "./Bingo";

afterEach(cleanup);
describe("Bingo", () => {
  it("knows rows, columns and diagonals", () => {
    expect(
      [
        [0, 1, 2, 3],
        [1, 5, 9, 13],
        [0, 5, 10, 15],
        [3, 6, 9, 12],
      ].every((l) => won(new Set(l))),
    ).toBe(true);
    expect(
      [
        [0, 1, 2],
        [0, 1, 2, 7],
        [3, 6, 9, 13],
      ].some((l) => won(new Set(l))),
    ).toBe(false);
  });
  it("tapping a full row wins; the same card is back after closing; New card deals again", () => {
    render(<Bingo onClose={() => {}} />);
    const squares = () => [...document.querySelectorAll<HTMLButtonElement>(".bingo .grid button")];
    expect(squares()).toHaveLength(16);
    const first = squares().map((b) => b.textContent);
    squares()
      .slice(0, 3)
      .forEach((b) => fireEvent.click(b));
    expect(screen.queryByText("Bingo!")).toBeNull();
    fireEvent.click(squares()[3]!);
    screen.getByText("Bingo!");
    cleanup();
    render(<Bingo onClose={() => {}} />);
    expect(squares().map((b) => b.textContent)).toEqual(first);
    screen.getByText("Bingo!");
    fireEvent.click(screen.getByText("New card")); // by text: jsdom leaves the dialog closed, so its buttons have no role
    expect(screen.queryByText("Bingo!")).toBeNull();
  });
});
