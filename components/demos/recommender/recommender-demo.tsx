"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalkthroughShell } from "@/components/demos/walkthrough-shell";
import {
  MOVIES,
  USER_RATINGS,
  findRecommendations,
} from "@/lib/demos/algorithms/collaborative-filter";

const USERS = Object.keys(USER_RATINGS);

function RatingMatrix({ highlightUser }: { highlightUser?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">User</th>
            {MOVIES.map((m) => (
              <th key={m} className="p-2 text-center text-xs">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {USERS.map((user) => (
            <tr key={user} className={user === highlightUser ? "bg-indigo-50" : ""}>
              <td className="p-2 font-medium">{user}</td>
              {USER_RATINGS[user].map((r, i) => (
                <td key={i} className="p-2 text-center">
                  {r !== null ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium">
                      {r}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">?</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RecommenderDemo() {
  const [activeUser, setActiveUser] = useState("Alice");
  const [result, setResult] = useState<ReturnType<typeof findRecommendations> | null>(null);

  const steps = [
    {
      id: "problem",
      title: "The Problem",
      story:
        "Netflix has thousands of movies. You can't watch them all. So how does it know what to put on your homepage? In 2001, researchers at Minnesota (and later the Netflix Prize) showed you don't need to understand movies at all. You just need to find people like you.",
      insight: "Netflix doesn't know your taste. It knows your neighbors' taste.",
      content: (
        <p className="text-sm text-muted-foreground">
          The core question: <strong className="text-foreground">Can we predict what you&apos;ll like based on what similar users liked?</strong>
        </p>
      ),
    },
    {
      id: "data",
      title: "The Data",
      story:
        "Here's a tiny version of what Netflix sees — 4 users, 6 movies, ratings from 1-5. Notice the gaps? Those are movies a user hasn't watched yet. Our job is to fill in the gaps with good predictions.",
      content: <RatingMatrix />,
    },
    {
      id: "method",
      title: "The Method",
      story:
        "Collaborative filtering compares your ratings to everyone else's. We use cosine similarity — if you and Bob both rated Inception 5 and Toy Story 4, you're 'similar.' Then we recommend movies your similar users loved that you haven't seen.",
      insight: "The algorithm never learns what a movie is about. It only learns who agrees with you.",
      content: (
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-muted p-4">
            <p className="font-medium">Step 1: Find users with similar ratings</p>
            <p className="text-muted-foreground">Compare rating vectors using cosine similarity</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-medium">Step 2: Weight their opinions</p>
            <p className="text-muted-foreground">More similar users get more influence</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-medium">Step 3: Predict your rating for unseen movies</p>
            <p className="text-muted-foreground">Recommend the highest predicted score</p>
          </div>
        </div>
      ),
    },
    {
      id: "recreate",
      title: "Recreate the Result",
      story:
        "Pick a user and run the recommender. Watch it find their taste-twins and suggest a movie. This is the same logic behind 'Because you watched...' — just with 4 users instead of 200 million.",
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {USERS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setActiveUser(u);
                  setResult(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeUser === u ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <RatingMatrix highlightUser={activeUser} />
          <Button
            onClick={() => setResult(findRecommendations(activeUser))}
            className="w-full"
            size="lg"
          >
            Find Similar Taste
          </Button>
          {result && (
            <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
              {result.similarUsers.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Users most like {activeUser}:</p>
                  {result.similarUsers.map((s) => (
                    <div key={s.user} className="flex justify-between text-sm">
                      <span>{s.user}</span>
                      <span className="font-mono">{(s.similarity * 100).toFixed(0)}% similar</span>
                    </div>
                  ))}
                </div>
              )}
              {result.recommendation ? (
                <div>
                  <p className="text-sm text-muted-foreground">Recommended for {activeUser}:</p>
                  <p className="text-2xl font-semibold text-indigo-700">
                    {result.recommendation.movie}
                  </p>
                  <p className="text-sm">
                    Predicted rating: <strong>{result.recommendation.predictedRating}/5</strong>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recommendation — not enough overlap.</p>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <WalkthroughShell
      title="I rebuilt Netflix recommendations"
      tagline="A table of opinions. That's it. That's the algorithm."
      paper={{
        title: "Item-based Collaborative Filtering Recommendation Algorithms",
        authors: "Sarwar, Karypis, Konstan & Riedl",
        year: "2001",
        citationStatus: "verified",
      }}
      steps={steps}
      whatStudentsLearn="Recommendations come from finding similar users, not from understanding content. Cosine similarity on rating vectors is the core technique."
      rebuildChallenge="Add yourself as a 5th user in Google Sheets. Rate 4 movies, leave 2 blank, and predict what the formula would recommend."
    />
  );
}
