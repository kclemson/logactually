import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CompactChartTooltip } from "./CompactChartTooltip";

describe("CompactChartTooltip", () => {
  const basePayload = [
    { dataKey: "calories", name: "Calories", value: 2100, color: "#2563EB", payload: { calories: 2100, totalCals: 2500, rawDate: "2025-01-15" } },
  ];

  it("renders nothing when active is false", () => {
    const { container } = render(
      <CompactChartTooltip active={false} payload={basePayload} label="Jan 15" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when payload is empty", () => {
    const { container } = render(
      <CompactChartTooltip active={true} payload={[]} label="Jan 15" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when payload is undefined", () => {
    const { container } = render(
      <CompactChartTooltip active={true} label="Jan 15" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders label and default formatted values when active", () => {
    render(
      <CompactChartTooltip active={true} payload={basePayload} label="Jan 15" />
    );
    expect(screen.getByText("Jan 15")).toBeInTheDocument();
    expect(screen.getByText("Calories: 2100")).toBeInTheDocument();
  });

  it("applies formatter to displayed values", () => {
    const formatter = (value: any, name: string) => `${name}: ${value} kcal`;
    render(
      <CompactChartTooltip active={true} payload={basePayload} label="Jan 15" formatter={formatter} />
    );
    expect(screen.getByText("Calories: 2100 kcal")).toBeInTheDocument();
  });

  it("handles array return from formatter (multi-line)", () => {
    const formatter = () => ["Line 1", "Line 2"];
    render(
      <CompactChartTooltip active={true} payload={basePayload} label="Jan 15" formatter={formatter} />
    );
    expect(screen.getByText("Line 1")).toBeInTheDocument();
    expect(screen.getByText("Line 2")).toBeInTheDocument();
  });

  it("shows total line when totalKey matches a key in payload data", () => {
    render(
      <CompactChartTooltip
        active={true}
        payload={basePayload}
        label="Jan 15"
        totalKey="totalCals"
        totalLabel="Total"
        totalColor="#FF0000"
      />
    );
    expect(screen.getByText("Total: 2500 cal")).toBeInTheDocument();
  });

  it("does not show total line when totalKey is absent", () => {
    render(
      <CompactChartTooltip active={true} payload={basePayload} label="Jan 15" />
    );
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
  });

  it("shows 'Go to day' button only when isTouchDevice is true", () => {
    const onGoToDay = vi.fn();
    const { rerender } = render(
      <CompactChartTooltip
        active={true}
        payload={basePayload}
        label="Jan 15"
        isTouchDevice={false}
        onGoToDay={onGoToDay}
        rawDate="2025-01-15"
      />
    );
    expect(screen.queryByText("Go to day →")).not.toBeInTheDocument();

    rerender(
      <CompactChartTooltip
        active={true}
        payload={basePayload}
        label="Jan 15"
        isTouchDevice={true}
        onGoToDay={onGoToDay}
        rawDate="2025-01-15"
      />
    );
    expect(screen.getByText("Go to day →")).toBeInTheDocument();
  });

  it("calls onGoToDay with correct date when button is clicked", () => {
    const onGoToDay = vi.fn();
    render(
      <CompactChartTooltip
        active={true}
        payload={basePayload}
        label="Jan 15"
        isTouchDevice={true}
        onGoToDay={onGoToDay}
        rawDate="2025-01-15"
      />
    );
    fireEvent.click(screen.getByText("Go to day →"));
    expect(onGoToDay).toHaveBeenCalledWith("2025-01-15");
  });
});
