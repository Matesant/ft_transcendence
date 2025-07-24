export default async function (fastify, opts) {
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const players = await fastify.db.all(
          'SELECT alias, display_name, wins, losses, avatar FROM user_profiles ORDER BY alias ASC'
        );

        // Calculate winrate for each player
        const playersWithStats = players.map((player) => {
          const winsCount = player.wins || 0;
          const lossesCount = player.losses || 0;
          const totalGames = winsCount + lossesCount;
          const winrate = totalGames > 0 ? Math.round((winsCount / totalGames) * 100) : 0;

          return {
            alias: player.alias,
            display_name: player.display_name,
            wins: winsCount,
            losses: lossesCount,
            winrate: winrate,
            avatar: player.avatar
          };
        });

        return playersWithStats;
      } catch (err) {
        console.error('Error retrieving players:', err);
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve players list' });
      }
    }
  );
}
