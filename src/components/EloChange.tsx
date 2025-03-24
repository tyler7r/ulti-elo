import { PlayerHistoryType, SquadType } from "@/lib/types";

type EloChangeProps = {
  squad: {
    info: SquadType;
    players: PlayerHistoryType[];
  };
};

const EloChange = ({ squad }: EloChangeProps) => {
  const { info, players } = squad;

  if (players.length === 0) {
    return <p>No players found for {info.name}</p>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-lg font-bold mb-2">{info.name}</h4>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-center">Elo Before</th>
              <th className="px-4 py-2 text-center">Elo After</th>
              <th className="px-4 py-2 text-center">Change</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const eloChange = player.elo_after - player.elo_before;
              const eloChangeClass =
                eloChange > 0 ? "text-green-500" : "text-red-500";

              return (
                <tr
                  key={player.id}
                  className="border-b hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2 text-center">{player.elo_before}</td>
                  <td className="px-4 py-2 text-center">{player.elo_after}</td>
                  <td
                    className={`px-4 py-2 text-center font-bold ${eloChangeClass}`}
                  >
                    {eloChange > 0 ? `+${eloChange}` : eloChange}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EloChange;
