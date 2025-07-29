interface MatchInfo {
    id: number;
    player1: string;
    player2: string;
    round: number;
    status: string;
}

import { apiUrl } from '../../../utils/api';

export class MatchManager {
    private _currentMatch: MatchInfo | null = null;
    private _player1Name: string = "Player 1";
    private _player2Name: string = "Player 2";

    constructor() {
        // Constructor is now simpler, loading happens in separate method
    }

    public async loadCurrentMatch(): Promise<void> {
        try {
            const response = await fetch(apiUrl(3002, '/match/next'), {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.tournamentComplete) {
                    this._currentMatch = null;
                    this._player1Name = "Player 1";
                    this._player2Name = "Player 2";
                    return;
                }
                
                if (data.match) {
                    this._currentMatch = data.match;
                    this._player1Name = data.match.player1;
                    this._player2Name = data.match.player2;
                    
                } else {
                    this._player1Name = "Player 1";
                    this._player2Name = "Player 2";
                }
            }
        } catch (error) {
            console.error('Failed to load match:', error);
            this._player1Name = "Player 1";
            this._player2Name = "Player 2";
        }
    }

    public async submitMatchResult(winner: string): Promise<{ tournamentComplete: boolean; champion?: string }> {
        if (!this._currentMatch) {
            return { tournamentComplete: false };
        }
        
        try {
            const response = await fetch(apiUrl(3002, '/match/score'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    matchId: this._currentMatch.id,
                    winner: winner
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                this._currentMatch = null;
                await this.loadCurrentMatch();
                
                const nextResponse = await fetch(apiUrl(3002, '/match/next'), {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (nextResponse.ok) {
                    const data = await nextResponse.json();
                    if (data.tournamentComplete) {
                        return { 
                            tournamentComplete: true, 
                            champion: data.champion 
                        };
                    }
                }
                
                return { tournamentComplete: false };
            } else {
                console.error('Failed to submit match result:', response.statusText);
                return { tournamentComplete: false };
            }
        } catch (error) {
            console.error('Error submitting match result:', error);
            return { tournamentComplete: false };
        }
    }

    public getCurrentMatch(): MatchInfo | null {
        return this._currentMatch;
    }

    public getPlayer1Name(): string {
        return this._player1Name;
    }

    public getPlayer2Name(): string {
        return this._player2Name;
    }

    public getPlayerNames(): { player1: string; player2: string } {
        return {
            player1: this._player1Name,
            player2: this._player2Name
        };
    }

    public setPlayerNames(player1: string, player2: string): void {
        this._player1Name = player1;
        this._player2Name = player2;
    }

    public clearMatch(): void {
        this._currentMatch = null;
    }
}
