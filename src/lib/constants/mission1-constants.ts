export const M1_QUEST1_CONSTANTS = {
  // m1-q1-barriers -> user_program_context.perceived_barriers
  barriers: {
    options: [
      {
        id: 'money',
        title: "I don't have the money.",
        description: "It feels like starting requires capital I can't afford to risk.",
        response: "Capital is a constraint, but it's often a puzzle, not a wall. Many businesses start simply by selling a service before buying inventory or building software. You don't need a VC fund to start moving."
      },
      {
        id: 'time',
        title: "I don't have enough time.",
        description: "My life is already full. I don't see where this fits.",
        response: "Time is zero-sum. Starting doesn't mean quitting your job tomorrow; it means finding two hours a week to answer one specific question. It is about momentum, not speed."
      },
      {
        id: 'knowledge',
        title: "I don't have the right training.",
        description: "I feel like I need a business degree, a course, or more experience before I'm qualified.",
        response: "You don't need permission or a certificate to start. Business isn't a secret society you have to study to enter—it's just solving a problem for someone and getting paid for it. Experience comes from the doing."
      },
      {
        id: 'fear_of_judgment',
        title: "I'm afraid of looking foolish.",
        description: "I worry about what people will think if I try this and fail.",
        response: "The fear of being seen trying is real and uncomfortable. But remember: the people who judge you usually aren't building anything themselves."
      },
      {
        id: 'clarity',
        title: "I don't know where to start.",
        description: "There are too many moving parts, and I feel paralyzed.",
        response: "The beginning is always messy. You don't need a map for the whole journey right now, just a flashlight for the next step."
      }
    ]
  },

  // m1-q1-motivation -> user_program_context.motivations
  motivations: {
    options: [
      {
        id: 'autonomy',
        title: "I want control over my time.",
        description: "I want to decide when and how I work.",
        response: "Autonomy is a powerful driver. You're trading comfortable predictability for the freedom to own your hours and your decisions."
      },
      {
        id: 'lifestyle',
        title: "I want a different lifestyle.",
        description: "I want to design how I live, rather than fitting my life around a job.",
        response: "Building a business to support the life you want—not the other way around—is a deeply pragmatic goal. It’s about building a machine that serves your reality."
      },
      {
        id: 'frustration',
        title: "I know I can do this better.",
        description: "I see broken processes or bad products, and it frustrates me.",
        response: "Frustration is a great catalyst. Seeing a broken process and knowing you can fix it is exactly how most lasting businesses actually begin."
      },
      {
        id: 'financial',
        title: "I need financial independence.",
        description: "I want to uncap my earning potential.",
        response: "Money is a valid reason to build. Just remember that it takes time and patience for a new engine to start generating its own power."
      },
      {
        id: 'ownership',
        title: "I want to build something of my own.",
        description: "I am tired of building someone else's dream.",
        response: "There is a profound difference between working on a piece of a machine and owning the machine itself. That shift in identity is exactly why you're here."
      }
    ]
  },

  // m1-q1-future -> user_program_context.desired_future
  future: {
    options: [
      {
        id: 'routine',
        title: "My daily routine.",
        description: "My Tuesday morning would look completely different.",
        response: "Changing what you do on a Tuesday morning changes your whole life. It's about designing your baseline reality."
      },
      {
        id: 'family',
        title: "My family's trajectory.",
        description: "I want to change the options available to my family.",
        response: "Generational shifts start with one person taking an uncomfortable risk. That is a heavy, beautiful reason to build."
      },
      {
        id: 'impact',
        title: "The impact I have.",
        description: "I would be directly solving problems for real people.",
        response: "Direct impact means no longer waiting for permission to help people or solve the problems that matter to you."
      },
      {
        id: 'self_trust',
        title: "Just proving I could do it.",
        description: "I need to know if I actually have what it takes.",
        response: "Self-trust is the quietest but most important return on this investment. Proving it to yourself matters more than proving it to the market."
      }
    ]
  },

  // m1-q1-quit -> user_program_context.quit_conditions
  quitConditions: {
    options: [
      {
        id: 'money_out',
        title: "Running out of runway.",
        description: "If this starts threatening my financial stability.",
        response: "That is just good sense. You are building a business, not a martyrdom. Knowing your absolute financial limit keeps you grounded."
      },
      {
        id: 'market_rejection',
        title: "Consistent rejection.",
        description: "If nobody actually wants what I am trying to offer.",
        response: "Rejection is exhausting. If the market repeatedly says no, choosing to pivot or stop isn't failure—it's just listening to reality."
      },
      {
        id: 'loss_of_interest',
        title: "It stops being interesting.",
        description: "If I wake up and realize I don't care about this problem anymore.",
        response: "If you don't care about the problem, you won't survive the hard days. Curiosity is a required fuel."
      },
      {
        id: 'personal_life',
        title: "It hurts my personal life.",
        description: "If this starts costing me my relationships or my health.",
        response: "A business that destroys your foundation isn't worth building. Drawing a hard line around your personal life is a massive strength."
      }
    ]
  }
};