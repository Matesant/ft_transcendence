export interface MatchInfo {
    id: number;
    player1: string;
    player2: string;
    round: number;
    status: string;
}

export interface NextMatchResponse {
    tournamentComplete?: boolean;
    champion?: string;
    match?: MatchInfo;
}

export class MatchService {
    private readonly _baseUrl = 'http://localhost:3002';

    async fetchNextMatch(): Promise<NextMatchResponse> {
        const response = await fetch(`${this._baseUrl}/match/next`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`Failed to load match: ${response.statusText}`);
        }
        return response.json();
    }

    async submitScore(matchId: number, winner: string): Promise<any> {
        const response = await fetch(`${this._baseUrl}/match/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ matchId, winner })
        });
        if (!response.ok) {
            throw new Error(`Failed to submit score: ${response.statusText}`);
        }
        return response.json();
    }
}
