export const challenges = [
    {
        id: 'so-mi-melody',
        title: 'So-Mi Melody',
        description: `Create a simple melody using only the notes 'so' (5th) and 'mi' (3rd) of the current scale.`,
        validator: 'validateSoMiOnly', // Implemented
        standard: {
            code: 'MU:Cr1.1.3',
            description: `Creating (Cr), Anchor Standard 1 (1.1): "Generate musical ideas for various purposes and contexts." Performance Indicator for 3rd Grade: "a. Generate rhythmic and melodic ideas, and identify musical ideas for a specific purpose."`
        }
    },
    {
        id: 'up-down-melody',
        title: 'Up and Down Melody',
        description: `Create one melody that primarily moves upwards and another that primarily moves downwards.`,
        validator: 'validateUpDownMelody', // TODO: Implement validator
        standard: {
            code: 'MU:Cr1.1.3',
            description: `Creating (Cr), Anchor Standard 1 (1.1): "Generate musical ideas for various purposes and contexts." Performance Indicator for 3rd Grade: "a. Generate rhythmic and melodic ideas, and identify musical ideas for a specific purpose."`
        }
    },
    {
        id: 'recreate-rain-rain',
        title: `Recreate "Rain Rain Go Away"`,
        description: `Recreate the "rain rain go away" melody in Song Maker.`,
        validator: 'validateRecreateRainRain', // TODO: Implement validator
        standard: {
            code: 'MU:Pr4.1.3',
            description: `Performing (Pr), Anchor Standard 4 (4.1): "Select varied musical works to present, based on interest, knowledge, technical skill, and context." Performance Indicator for 3rd Grade: "a. Apply teacher-provided criteria to explain and demonstrate how the music that they selected to perform representing contrasting styles is selected (from teacher- or student-provided options), based on personal interest, knowledge, purpose, context, and their own and others' technical skill."`
        }
    },
    {
        id: 'note-count-3',
        title: 'Note Count (3)',
        description: `Create a melody using exactly 3 notes.`,
        validator: 'validateNoteCount3', // TODO: Implement validator
        standard: {
            code: 'MU:Cr1.1.3a', // Reusing a standard for generating ideas
            description: `Creating (Cr), Anchor Standard 1 (1.1): "Generate musical ideas for various purposes and contexts." Performance Indicator for 3rd Grade: "a. Generate rhythmic and melodic ideas, and identify musical ideas for a specific purpose."`
        }
    },
    {
        id: 'change-tempo',
        title: 'Change Tempo',
        description: `Create a melody in Song Maker and then change the tempo.`,
        validator: 'validateTempoChange', // TODO: Implement validator (requires tracking previous state)
        standard: {
            code: 'MU:Pr4.3.3',
            description: `Performing (Pr), Anchor Standard 4 (4.3): "Develop personal interpretations that consider creators' intent." Performance Indicator for 3rd Grade: "a. Demonstrate and describe music's expressive qualities (such as dynamics and tempo) and how creators use them to convey expressive intent."`
        }
    },
    {
        id: 'extend-melody',
        title: 'Extend Melody',
        description: `Create a four-measure melody. Change the length to eight bars and either extend the melody or create a contrasting one.`,
        validator: 'validateExtendMelody', // TODO: Implement validator (requires tracking previous state/length)
        standard: {
            code: 'MU:Cr2.1.4',
            description: `Creating (Cr), Anchor Standard 2 (2.1): "Organize and develop artistic ideas and work." Performance Indicator for 4th Grade: "a. With limited guidance, organize musical ideas using iconic or standard notation and/or recording technology to combine, sequence, and document musical phrases."`
        }
    },
    {
        id: 'change-instrument',
        title: 'Change Instrument',
        description: `Create a melody and then change the instrument sound.`,
        validator: 'validateInstrumentChange', // TODO: Implement validator (requires tracking previous state)
        standard: {
            code: 'MU:Pr4.3.4',
            description: `Performing (Pr), Anchor Standard 4 (4.3): "Develop personal interpretations that consider creators' intent." Performance Indicator for 4th Grade: "a. Demonstrate and identify the context and how intent is conveyed through interpretive decisions (such as dynamics and tempo)."`
        }
    },
    {
        id: 'simple-rhythm',
        title: 'Simple Rhythm Pattern',
        description: `Create a simple rhythmic pattern using the percussion sounds at the bottom.`,
        validator: 'validateSimpleRhythm', // TODO: Implement validator
        standard: {
            code: 'MU:Cr1.1.3',
            description: `Creating (Cr), Anchor Standard 1 (1.1): "Generate musical ideas for various purposes and contexts." Performance Indicator for 3rd Grade: "a. Generate rhythmic and melodic ideas, and identify musical ideas for a specific purpose."`
        }
    },
    {
        id: 'combine-melody-rhythm',
        title: 'Melody + Rhythm',
        description: `Combine a short melody in Song Maker with a simple percussion pattern.`,
        validator: 'validateCombineMelodyRhythm', // TODO: Implement validator
        standard: {
            code: 'MU:Cr2.1.4',
            description: `Creating (Cr), Anchor Standard 2 (2.1): "Organize and develop artistic ideas and work." Performance Indicator for 4th Grade: "a. With limited guidance, organize musical ideas using iconic or standard notation and/or recording technology to combine, sequence, and document musical phrases."`
        }
    },
    {
        id: 'simple-harmony',
        title: 'Simple Harmony',
        description: `Create a melody in the key of C and then try adding another note at the same time to create a simple harmony.`,
        validator: 'validateSimpleHarmony', // TODO: Implement validator
        standard: {
            code: 'MU:Cr1.1.4',
            description: `Creating (Cr), Anchor Standard 1 (1.1): "Generate musical ideas for various purposes and contexts." Performance Indicator for 4th Grade: "a. Generate melodic ideas (such as answering musical questions) for a specific purpose and context."`
        }
    },
    {
        id: 'symmetry-horizontal',
        title: 'Symmetrical Pattern',
        description: `Create a melody that is symmetrical (reads the same forwards and backwards).`,
        validator: 'validateSymmetryHorizontal', // TODO: Implement validator
        standard: {
            code: 'MU:Cr2.1.4a', // Reusing a standard for organizing ideas
            description: `Creating (Cr), Anchor Standard 2 (2.1): "Organize and develop artistic ideas and work." Performance Indicator for 4th Grade: "a. With limited guidance, organize musical ideas using iconic or standard notation and/or recording technology to combine, sequence, and document musical phrases."`
        }
    },
    {
        id: 'explore-scales',
        title: 'Explore Scales',
        description: `Explore different scales (major, chromatic, pentatonic) in settings. Create a short melody using each scale.`,
        validator: 'validateExploreScales', // TODO: Implement validator (requires tracking settings changes and creations)
        standard: {
            code: 'MU:Pr4.2.5',
            description: `Performing (Pr), Anchor Standard 4 (4.2): "Analyze the structure and context of varied musical works and their implications for performance." Performance Indicator for 5th Grade: "a. Demonstrate knowledge of the elements of music (such as rhythm and pitch) in music selected for performance."`
        }
    },
    {
        id: 'explore-subdivisions',
        title: 'Explore Subdivisions',
        description: `Change the beat subdivisions in settings (1, 2, 3, 4). Create a simple rhythmic pattern with each subdivision.`,
        validator: 'validateExploreSubdivisions', // TODO: Implement validator (requires tracking settings changes and creations)
        standard: {
            code: 'MU:Pr4.2.5',
            description: `Performing (Pr), Anchor Standard 4 (4.2): "Analyze the structure and context of varied musical works and their implications for performance." Performance Indicator for 5th Grade: "a. Demonstrate knowledge of the elements of music (such as rhythm and pitch) in music selected for performance"`
        }
    }
]; 