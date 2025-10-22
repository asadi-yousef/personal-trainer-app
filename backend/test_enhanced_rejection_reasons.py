"""
Test script to demonstrate enhanced rejection reasons in optimal schedule algorithm.
This shows the specific rejection reasons that will be provided.
"""

def demonstrate_rejection_reasons():
    """Demonstrate the enhanced rejection reasons."""
    
    print("=== ENHANCED REJECTION REASONS DEMONSTRATION ===\n")
    
    # Example rejection reasons that the algorithm now provides:
    rejection_examples = [
        {
            "scenario": "Outside work hours",
            "reason": "Requested time 14:30 is outside work hours (08:00 - 12:00)"
        },
        {
            "scenario": "Day off",
            "reason": "Requested day (Saturday) is marked as a day off in your preferences"
        },
        {
            "scenario": "Daily limit reached",
            "reason": "Maximum sessions per day limit reached (3 sessions) for 2024-01-15"
        },
        {
            "scenario": "Direct time conflict",
            "reason": "Direct time conflict with existing booking at 09:00 - 10:00"
        },
        {
            "scenario": "Insufficient break time (before)",
            "reason": "Insufficient break time (15 minutes required) before existing session ending at 10:00"
        },
        {
            "scenario": "Insufficient break time (after)",
            "reason": "Insufficient break time (15 minutes required) after existing session starting at 11:00"
        },
        {
            "scenario": "Conflict with other approved request",
            "reason": "Direct time conflict with other approved request at 09:30 - 10:30"
        },
        {
            "scenario": "No time specified",
            "reason": "Request has no start/end time specified"
        }
    ]
    
    print("The algorithm now provides specific rejection reasons:\n")
    
    for i, example in enumerate(rejection_examples, 1):
        print(f"{i}. {example['scenario']}:")
        print(f"   Reason: {example['reason']}")
        print()
    
    print("=== BENEFITS OF ENHANCED REJECTION REASONS ===")
    print("✅ Better user experience - clients understand why requests were rejected")
    print("✅ Actionable feedback - clients can adjust their requests accordingly")
    print("✅ Transparency - builds trust in the scheduling system")
    print("✅ Reduced support queries - fewer 'why was I rejected?' questions")
    print("✅ Professional appearance - detailed, helpful error messages")

if __name__ == "__main__":
    demonstrate_rejection_reasons()
