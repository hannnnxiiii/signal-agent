interface CandidateRepo {
  owner: string;
  name: string;
  description: string;
  language?: string;
}

interface SelectCandidatesArgs {
  candidates: CandidateRepo[];
  recentRepoNames: string[];
}

export async function selectCandidates(args: SelectCandidatesArgs) {
  const selected = args.candidates
    .filter((candidate) => !args.recentRepoNames.includes(`${candidate.owner}/${candidate.name}`))
    .slice(0, 5);

  return { selected };
}
