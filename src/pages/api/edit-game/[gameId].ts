// /pages/api/edit-game/[gameId].ts
import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";

// interface Player {
//   id: string;
//   name: string;
// }

interface SquadPlayer {
  id: string;
  name: string;
  elo_before: number;
  elo_after: number;
  is_winner: boolean;
}

interface Squad {
  id: string;
  name: string;
  players: SquadPlayer[];
}

interface Game {
  id: string;
  match_date: string;
  team_id: string;
  squad_a_id: string;
  squad_b_id: string;
  squad_a_score: number;
  squad_b_score: number;
}

interface GameDetailsResponse {
  game: Game;
  squadA: Squad & {
    players: { id: string; name: string; is_winner?: boolean }[];
  };
  squadB: Squad & {
    players: { id: string; name: string; is_winner?: boolean }[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameDetailsResponse | { error: string }>
) {
  if (req.method === "GET") {
    const { gameId } = req.query;

    if (!gameId || typeof gameId !== "string") {
      return res.status(400).json({ error: "Missing or invalid gameId" });
    }

    try {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single<Game>();

      if (gameError) {
        console.error("Error fetching game:", gameError);
        return res.status(500).json({ error: "Failed to fetch game details" });
      }

      const { data: squadA, error: squadAError } = await supabase
        .from("squads")
        .select("id, name")
        .eq("id", game.squad_a_id)
        .single();

      if (squadAError) {
        console.error("Error fetching squad A:", squadAError);
        return res
          .status(500)
          .json({ error: "Failed to fetch squad A details" });
      }

      const { data: squadB, error: squadBError } = await supabase
        .from("squads")
        .select("id, name")
        .eq("id", game.squad_b_id)
        .single();

      if (squadBError) {
        console.error("Error fetching squad B:", squadBError);
        return res
          .status(500)
          .json({ error: "Failed to fetch squad B details" });
      }

      const { data: gamePlayersA, error: gamePlayersAError } = await supabase
        .from("game_players")
        .select("player_id, is_winner, elo_before, elo_after, players(name)")
        .eq("game_id", gameId)
        .eq("squad_id", game.squad_a_id);

      if (gamePlayersAError) {
        console.error(
          "Error fetching game players for squad A:",
          gamePlayersAError
        );
        return res
          .status(500)
          .json({ error: "Failed to fetch game players for squad A" });
      }

      const { data: gamePlayersB, error: gamePlayersBError } = await supabase
        .from("game_players")
        .select("player_id, is_winner, elo_before, elo_after, players(name)")
        .eq("game_id", gameId)
        .eq("squad_id", game.squad_b_id);

      if (gamePlayersBError) {
        console.error(
          "Error fetching game players for squad B:",
          gamePlayersBError
        );
        return res
          .status(500)
          .json({ error: "Failed to fetch game players for squad B" });
      }

      const formattedSquadA = {
        ...squadA,
        players: gamePlayersA.map((sp) => ({
          id: sp.player_id,
          name: sp.players.name,
          elo_before: sp.elo_before,
          elo_after: sp.elo_after,
          is_winner: sp.is_winner,
        })),
      };

      const formattedSquadB = {
        ...squadB,
        players: gamePlayersB.map((sp) => ({
          id: sp.player_id,
          name: sp.players.name,
          elo_before: sp.elo_before,
          elo_after: sp.elo_after,
          is_winner: sp.is_winner,
        })),
      };

      res
        .status(200)
        .json({ game, squadA: formattedSquadA, squadB: formattedSquadB });
    } catch (error) {
      console.error("Error in API route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
