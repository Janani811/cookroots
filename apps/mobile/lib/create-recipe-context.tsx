import { createContext, ReactNode, useContext, useState } from "react";

export interface CreateRecipeState {
  inputMethod: "text" | "voice";
  recipeText: string;
  language: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  ingredients: Array<{ name: string; quantity: string }>;
  steps: Array<{ stepNumber: number; instructionText: string }>;
  cookingTimeMinutes: number | null;
}

const initialState: CreateRecipeState = {
  inputMethod: "text",
  recipeText: "",
  language: "auto",
  title: "",
  description: "",
  difficulty: "medium",
  tags: [],
  ingredients: [],
  steps: [],
  cookingTimeMinutes: null,
};

interface CreateRecipeContextValue {
  state: CreateRecipeState;
  update: (updates: Partial<CreateRecipeState>) => void;
  reset: () => void;
}

const CreateRecipeContext = createContext<CreateRecipeContextValue | null>(null);

export function CreateRecipeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CreateRecipeState>(initialState);

  function update(updates: Partial<CreateRecipeState>) {
    setState((s) => ({ ...s, ...updates }));
  }

  function reset() {
    setState(initialState);
  }

  return (
    <CreateRecipeContext.Provider value={{ state, update, reset }}>
      {children}
    </CreateRecipeContext.Provider>
  );
}

export function useCreateRecipe() {
  const ctx = useContext(CreateRecipeContext);
  if (!ctx) throw new Error("useCreateRecipe must be used within CreateRecipeProvider");
  return ctx;
}
