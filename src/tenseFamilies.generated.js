/* AUTO-GENERATED from design-tokens/tokens.json — do not edit by hand.
   Change tokens.json and run `npm run sync` in Apps/design-tokens. */
// Familias de tiempos: tono = tiempo, intensidad = aspecto. bg[0..3] = simple → perfecto continuo.
export const ASPECTS = [
  {
    "id": "simple",
    "label": "Simple",
    "icon": "●",
    "mix": 10
  },
  {
    "id": "continuous",
    "label": "Continuo",
    "icon": "◐",
    "mix": 22
  },
  {
    "id": "perfect",
    "label": "Perfecto",
    "icon": "◆",
    "mix": 40
  },
  {
    "id": "perfect-continuous",
    "label": "Perf. Continuo",
    "icon": "◈",
    "mix": 100
  }
];
export const TENSE_FAMILIES = {
  "past": {
    "label": "Pasado",
    "icon": "◄",
    "color": {
      "light": "#7c3aed",
      "dark": "#a78bfa"
    },
    "ink": {
      "light": "#5b21b6",
      "dark": "#c4b5fd"
    },
    "bg": {
      "light": [
        "#f2ebfd",
        "#e2d4fb",
        "#cbb0f8",
        "#7c3aed"
      ],
      "dark": [
        "#23243b",
        "#343155",
        "#4f467b",
        "#a78bfa"
      ]
    }
  },
  "present": {
    "label": "Presente",
    "icon": "◉",
    "color": {
      "light": "#059669",
      "dark": "#34d399"
    },
    "ink": {
      "light": "#045138",
      "dark": "#6ee7b7"
    },
    "bg": {
      "light": [
        "#e6f5f0",
        "#c8e8de",
        "#9bd5c3",
        "#059669"
      ],
      "dark": [
        "#172b32",
        "#1b413f",
        "#216354",
        "#34d399"
      ]
    }
  },
  "future": {
    "label": "Futuro",
    "icon": "►",
    "color": {
      "light": "#0891b2",
      "dark": "#22d3ee"
    },
    "ink": {
      "light": "#0e5c70",
      "dark": "#7dd3fc"
    },
    "bg": {
      "light": [
        "#e6f4f7",
        "#c9e7ee",
        "#9cd3e0",
        "#0891b2"
      ],
      "dark": [
        "#152b3a",
        "#174152",
        "#1a6376",
        "#22d3ee"
      ]
    }
  },
  "modal": {
    "label": "Modal / Condicional",
    "icon": "◈",
    "color": {
      "light": "#4f46e5",
      "dark": "#8a83ff"
    },
    "ink": {
      "light": "#3730a3",
      "dark": "#bbb6ff"
    },
    "bg": {
      "light": [
        "#ededfc",
        "#d8d6f9",
        "#b9b5f5",
        "#4f46e5"
      ],
      "dark": [
        "#20233c",
        "#2e3056",
        "#43437d",
        "#8a83ff"
      ]
    }
  }
};
