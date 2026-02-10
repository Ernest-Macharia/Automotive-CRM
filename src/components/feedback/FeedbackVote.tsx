'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { feedbackService } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';

interface FeedbackVoteProps {
  feedbackId: string;
  initialVoteCount: number;
  initialUserVoted?: boolean;
  showCount?: boolean;
  compact?: boolean;
}

export default function FeedbackVote({
  feedbackId,
  initialVoteCount,
  initialUserVoted = false,
  showCount = true,
  compact = false,
}: FeedbackVoteProps) {
  const { showToast } = useToast();
  
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVoted, setUserVoted] = useState(initialUserVoted);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    try {
      setLoading(true);
      const result = await feedbackService.voteFeedback(feedbackId);
      
      setVoteCount(result.voteCount);
      setUserVoted(result.voted);
      
      showToast(
        result.voted 
          ? 'Thanks for your vote!' 
          : 'Vote removed',
        'success'
      );
    } catch (error) {
      console.error('Error voting:', error);
      showToast('Failed to record vote', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleVote}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
          userVoted
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <ThumbsUp className="h-3 w-3" />
        {showCount && <span>{voteCount}</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleVote}
        disabled={loading}
        className={`p-3 rounded-xl transition-all duration-200 ${
          userVoted
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
        }`}
      >
        {userVoted ? (
          <Check className="h-5 w-5" />
        ) : (
          <ThumbsUp className="h-5 w-5" />
        )}
      </button>
      
      {showCount && (
        <div className="mt-2 text-center">
          <div className="text-xl font-bold text-gray-800">{voteCount}</div>
          <div className="text-xs text-gray-500">votes</div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        {userVoted ? 'You voted for this' : 'Vote if you agree'}
      </div>
    </div>
  );
}