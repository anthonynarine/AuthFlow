import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { DeleteUnusedDialog } from "./ApplicationDialogs";
const app = { slug: "moneta", can_delete: true };
test("deletion requires exact slug and successful server response", async () => {
 const mutateAsync = jest.fn().mockResolvedValue(); const onDeleted = jest.fn();
 render(<DeleteUnusedDialog application={app} mutation={{ mutateAsync }} onClose={jest.fn()} onDeleted={onDeleted} />);
 const button = screen.getByRole("button", { name: "Delete application" });
 expect(button).toBeDisabled();
 fireEvent.change(screen.getByRole("textbox"), { target: { value: "Moneta" } }); expect(button).toBeDisabled();
 fireEvent.change(screen.getByRole("textbox"), { target: { value: "moneta" } }); fireEvent.click(button);
 await screen.findByRole("button", { name: "Delete application" });
 expect(mutateAsync).toHaveBeenCalledWith("moneta");
 await Promise.resolve(); expect(onDeleted).toHaveBeenCalledTimes(1);
});
test("missing eligibility fails closed and server refusal never navigates", async () => {
 const mutateAsync = jest.fn().mockRejectedValue(new Error("history")); const onDeleted = jest.fn();
 const { rerender } = render(<DeleteUnusedDialog application={{ slug: "moneta" }} mutation={{ mutateAsync }} onClose={jest.fn()} onDeleted={onDeleted} />);
 fireEvent.change(screen.getByRole("textbox"), { target: { value: "moneta" } });
 expect(screen.getByRole("button", { name: "Delete application" })).toBeDisabled();
 rerender(<DeleteUnusedDialog application={app} mutation={{ mutateAsync }} onClose={jest.fn()} onDeleted={onDeleted} />);
 fireEvent.click(screen.getByRole("button", { name: "Delete application" }));
 await Promise.resolve(); await Promise.resolve(); expect(onDeleted).not.toHaveBeenCalled();
});
