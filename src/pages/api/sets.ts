export const sets = [
  { setName: "Base Set", count: 120 },
  { setName: "Expansion Alpha", count: 80 },
  { setName: "Promo", count: 12 },
  { setName: "Sin set", count: 5 }
];

export default function handler() {
  return new Response(
    JSON.stringify(sets),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
} 