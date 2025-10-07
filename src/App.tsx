import React, { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, Zap, Target, FlaskConical } from 'lucide-react';

const PromptScience = () => {
  const [selectedModel, setSelectedModel] = useState('claude');
  const [complexity, setComplexity] = useState('detailed');
  const [learningMode, setLearningMode] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [mediaForm, setMediaForm] = useState(null);
  const [iterations, setIterations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showIterations, setShowIterations] = useState(false);
  const [showFirstWarning, setShowFirstWarning] = useState(false);
  const [showSecondWarning, setShowSecondWarning] = useState(false);
  const [pendingModel, setPendingModel] = useState(null);

  // Load preferences from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    const savedComplexity = localStorage.getItem('complexity');
    if (savedModel) setSelectedModel(savedModel);
    if (savedComplexity) setComplexity(savedComplexity);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
    localStorage.setItem('complexity', complexity);
  }, [selectedModel, complexity]);

  const handleModelChange = (newModel) => {
    // If switching to ChatGPT, show warning
    if (newModel === 'chatgpt' && selectedModel === 'claude') {
      setPendingModel(newModel);
      setShowFirstWarning(true);
    } else {
      // Switching to Claude, no warning
      setSelectedModel(newModel);
    }
  };

  const handleFirstWarningConfirm = () => {
    setShowFirstWarning(false);
    setShowSecondWarning(true);
  };

  const handleFirstWarningCancel = () => {
    setShowFirstWarning(false);
    setPendingModel(null);
  };

  const handleSecondWarningConfirm = () => {
    setShowSecondWarning(false);
    setSelectedModel(pendingModel);
    setPendingModel(null);
  };

  const handleSecondWarningCancel = () => {
    setShowSecondWarning(false);
    setPendingModel(null);
  };

  const examplePrompts = [
    "help me write a blog post about AI",
    "create a workout plan",
    "write a video script about sustainable living",
    "make a presentation on climate change"
  ];

  const improvePrompt = (input, model, level) => {
    if (input.length < 10) {
      return { improved: "Please enter a more detailed prompt (at least 10 characters).", annotations: [], mediaForm: null };
    }

    const annotations = [];
    
    // Infer media form first
    const mediaForm = inferMediaForm(input);
    
    // Add media form annotation if it's not general
    if (mediaForm.type !== 'general') {
      annotations.push({
        section: 'Media Form Detection',
        text: mediaForm.label,
        explanation: `Automatically detected desired output format as "${mediaForm.label}" based on prompt keywords. This influences the Response Format structure.`,
        type: 'detection'
      });
    }
    
    // Infer COSTAR components
    const context = inferContext(input, level, mediaForm);
    const objective = inferObjective(input);
    const style = inferStyle(input, model);
    const tone = inferTone(input);
    const audience = inferAudience(input);
    const responseFormat = inferResponseFormat(input, model, level);

    annotations.push({
      section: 'Context',
      text: context,
      explanation: 'Sets the background and situational parameters for the AI to understand the request scope',
      type: 'context'
    });

    annotations.push({
      section: 'Objective',
      text: objective,
      explanation: 'Clearly defines what the AI should accomplish and the desired outcome',
      type: 'objective'
    });

    annotations.push({
      section: 'Style',
      text: style,
      explanation: model === 'claude' ? 'Claude excels with structured, methodical approaches' : 'ChatGPT responds well to expressive, conversational styles',
      type: 'style'
    });

    annotations.push({
      section: 'Tone',
      text: tone,
      explanation: 'Specifies the emotional quality and formality level of the response',
      type: 'tone'
    });

    annotations.push({
      section: 'Audience',
      text: audience,
      explanation: 'Identifies who will consume the output to calibrate complexity and terminology',
      type: 'audience'
    });

    annotations.push({
      section: 'Response Format',
      text: responseFormat,
      explanation: 'Structures the output format for consistency and usability',
      type: 'format'
    });

    // Build the improved prompt in COSTAR format
    let improved = `**Context**\n${context}\n\n`;
    improved += `**Objective**\n${objective}\n\n`;
    improved += `**Style**\n${style}\n\n`;
    improved += `**Tone**\n${tone}\n\n`;
    improved += `**Audience**\n${audience}\n\n`;
    improved += `**Response Format**\n${responseFormat}`;

    return { improved, annotations, mediaForm };
  };

  const inferContext = (input, level, mediaForm) => {
    const lower = input.toLowerCase();
    let context = '';
    
    // Start with media form if detected
    if (mediaForm && mediaForm.type !== 'general') {
      context = `This task involves creating ${mediaForm.label.toLowerCase()}. `;
    }

    if (lower.includes('code') || lower.includes('debug') || lower.includes('program')) {
      context += 'You are assisting with a software development task. ';
      if (level === 'comprehensive') {
        context += 'This is part of an active project requiring technical precision and best practices. The solution should be production-ready and follow industry standards.';
      } else if (level === 'detailed') {
        context += 'The task requires working code with clear explanations of the approach.';
      } else {
        context += 'A straightforward coding solution is needed.';
      }
    } else if (lower.includes('write') || lower.includes('blog') || lower.includes('article') || lower.includes('content')) {
      context += 'You are helping create written content for publication or sharing. ';
      if (level === 'comprehensive') {
        context += 'This content will be published and should represent professional-quality work with engaging narrative and well-researched information.';
      } else if (level === 'detailed') {
        context += 'The content should be well-structured and engaging for readers.';
      } else {
        context += 'Basic content creation is needed.';
      }
    } else if (lower.includes('explain') || lower.includes('teach') || lower.includes('learn')) {
      context += 'You are providing educational content to help someone understand a topic. ';
      if (level === 'comprehensive') {
        context += 'The explanation should be thorough, building from foundational concepts to more advanced understanding with clear examples.';
      } else if (level === 'detailed') {
        context += 'The explanation should cover key concepts with helpful examples.';
      } else {
        context += 'A clear, simple explanation is needed.';
      }
    } else if (lower.includes('plan') || lower.includes('strategy') || lower.includes('design')) {
      context += 'You are helping develop a plan or strategy. ';
      if (level === 'comprehensive') {
        context += 'This requires systematic thinking with consideration of multiple factors, potential obstacles, and implementation details.';
      } else if (level === 'detailed') {
        context += 'The plan should be practical and actionable.';
      } else {
        context += 'A basic plan outline is needed.';
      }
    } else {
      if (!mediaForm || mediaForm.type === 'general') {
        context = 'You are assisting with a general request. ';
      }
      if (level === 'comprehensive') {
        context += 'Provide thorough, well-considered output that addresses multiple dimensions of the request.';
      } else if (level === 'detailed') {
        context += 'Provide helpful, complete information addressing the request.';
      } else {
        context += 'Provide a straightforward response.';
      }
    }

    return context.trim();
  };

  const inferObjective = (input) => {
    const lower = input.toLowerCase();
    
    if (lower.includes('write') || lower.includes('create') || lower.includes('generate')) {
      const subject = extractSubject(input);
      return `Create ${subject} that effectively communicates the intended message and engages the target audience. The output should be ready to use with minimal editing required.`;
    } else if (lower.includes('explain') || lower.includes('teach') || lower.includes('understand')) {
      const subject = extractSubject(input);
      return `Provide a clear, comprehensive explanation of ${subject} that builds understanding from the ground up. Use examples and analogies where helpful to make concepts concrete.`;
    } else if (lower.includes('debug') || lower.includes('fix') || lower.includes('solve')) {
      return `Identify the root cause of the issue and provide a working solution with explanation. The fix should resolve the problem while maintaining code quality and following best practices.`;
    } else if (lower.includes('analyze') || lower.includes('evaluate') || lower.includes('assess')) {
      const subject = extractSubject(input);
      return `Conduct a thorough analysis of ${subject}, identifying key patterns, insights, and implications. Provide evidence-based conclusions and actionable recommendations.`;
    } else if (lower.includes('plan') || lower.includes('design') || lower.includes('strategy')) {
      const subject = extractSubject(input);
      return `Develop a comprehensive ${subject} that is practical, actionable, and accounts for relevant constraints. Include clear steps for implementation.`;
    } else {
      const subject = extractSubject(input);
      return `Address the request regarding ${subject} with thorough, accurate information that directly fulfills the stated need. Ensure the response is complete and actionable.`;
    }
  };

  const extractSubject = (input) => {
    const lower = input.toLowerCase();
    
    // Try to extract the main subject
    const aboutMatch = input.match(/about\s+([^.,!?]+)/i);
    if (aboutMatch) return aboutMatch[1].trim();
    
    const forMatch = input.match(/for\s+([^.,!?]+)/i);
    if (forMatch) return forMatch[1].trim();
    
    const onMatch = input.match(/on\s+([^.,!?]+)/i);
    if (onMatch) return onMatch[1].trim();
    
    // Extract key nouns
    const words = input.split(' ').filter(w => w.length > 3);
    if (words.length > 0) {
      return words.slice(0, 3).join(' ');
    }
    
    return 'the requested topic';
  };

  const inferStyle = (input, model) => {
    const lower = input.toLowerCase();
    
    if (model === 'claude') {
      if (lower.includes('code') || lower.includes('technical') || lower.includes('analyze')) {
        return 'Systematic and methodical with clear logical progression. Use structured formatting with sections, numbered steps, or bullet points to organize complex information. Emphasize thoroughness and precision in explanations.';
      } else if (lower.includes('creative') || lower.includes('story') || lower.includes('write')) {
        return 'Organized yet flowing, with clear structure that supports the narrative. Use sections to break down the creative process while maintaining engaging prose. Balance structure with expressiveness.';
      } else {
        return 'Clear and well-organized with logical flow. Use headings, sections, or numbered points to guide the reader through the information. Prioritize clarity and systematic presentation of ideas.';
      }
    } else { // chatgpt
      if (lower.includes('code') || lower.includes('technical')) {
        return 'Conversational yet precise, like an expert colleague explaining a solution. Use natural language to walk through technical concepts, incorporating examples and analogies to clarify complex points.';
      } else if (lower.includes('creative') || lower.includes('story') || lower.includes('write')) {
        return 'Expressive and engaging with dynamic energy. Let creativity flow naturally while maintaining coherence. Use vivid language and varied sentence structure to maintain reader interest.';
      } else if (lower.includes('explain') || lower.includes('teach')) {
        return 'Friendly and approachable, like a knowledgeable teacher. Break down concepts naturally through conversation, building on each idea progressively with relatable examples.';
      } else {
        return 'Natural and conversational with a personable touch. Present information in a flowing, easy-to-follow manner that feels like expert guidance from a helpful collaborator.';
      }
    }
  };

  const inferTone = (input) => {
    const lower = input.toLowerCase();
    
    if (lower.includes('professional') || lower.includes('business') || lower.includes('formal')) {
      return 'Professional and authoritative, maintaining formality appropriate for business contexts. Confident and polished in presentation.';
    } else if (lower.includes('casual') || lower.includes('friendly') || lower.includes('fun')) {
      return 'Casual and friendly, approachable in manner. Warm and conversational without sacrificing clarity or helpfulness.';
    } else if (lower.includes('technical') || lower.includes('code') || lower.includes('scientific')) {
      return 'Technical and precise, focusing on accuracy and clarity. Matter-of-fact while remaining accessible to the target audience.';
    } else if (lower.includes('simple') || lower.includes('beginner') || lower.includes('explain')) {
      return 'Patient and encouraging, supportive of learning. Clear and reassuring without being condescending.';
    } else if (lower.includes('creative') || lower.includes('inspiring')) {
      return 'Enthusiastic and inspiring, energizing in nature. Confident and motivating while remaining authentic.';
    } else {
      return 'Balanced and informative, professional yet approachable. Clear and helpful with appropriate warmth.';
    }
  };

  const inferAudience = (input) => {
    const lower = input.toLowerCase();
    
    if (lower.includes('beginner') || lower.includes('new to') || lower.includes('never') || lower.includes('simple')) {
      return 'Beginners or individuals new to the topic who need foundational explanations. Assume minimal prior knowledge and define technical terms. Focus on building understanding step-by-step.';
    } else if (lower.includes('expert') || lower.includes('advanced') || lower.includes('technical') || lower.includes('professional')) {
      return 'Experts or professionals in the field with strong foundational knowledge. Use appropriate technical terminology and focus on nuanced insights rather than basic explanations.';
    } else if (lower.includes('student') || lower.includes('learn') || lower.includes('study')) {
      return 'Students or learners actively trying to understand and retain information. Emphasize clear explanations with examples that aid comprehension and memory.';
    } else if (lower.includes('business') || lower.includes('executive') || lower.includes('manager')) {
      return 'Business professionals or decision-makers focused on practical applications and outcomes. Emphasize actionable insights and real-world implications over theoretical details.';
    } else if (lower.includes('developer') || lower.includes('programmer') || lower.includes('code')) {
      return 'Developers or technical practitioners who understand programming concepts. Use relevant technical terminology and focus on implementation details and best practices.';
    } else if (lower.includes('general') || lower.includes('everyone')) {
      return 'General audience with diverse backgrounds and knowledge levels. Strike a balance between accessibility and depth, explaining key concepts without oversimplifying.';
    } else {
      return 'Informed general audience with reasonable baseline knowledge of the topic. Provide substantive information while remaining accessible, defining specialized terms when used.';
    }
  };

  const inferMediaForm = (input) => {
    const lower = input.toLowerCase();
    
    // Video/Audio content
    if (lower.includes('video script') || lower.includes('youtube script') || lower.includes('screenplay')) {
      return { type: 'video_script', label: 'Video Script' };
    }
    if (lower.includes('podcast') || lower.includes('audio script')) {
      return { type: 'podcast', label: 'Podcast Script' };
    }
    
    // Written content
    if (lower.includes('blog') || lower.includes('article') || lower.includes('post')) {
      return { type: 'blog', label: 'Blog Post/Article' };
    }
    if (lower.includes('essay') || lower.includes('paper')) {
      return { type: 'essay', label: 'Essay/Paper' };
    }
    if (lower.includes('email') || lower.includes('message')) {
      return { type: 'email', label: 'Email/Message' };
    }
    if (lower.includes('story') || lower.includes('fiction') || lower.includes('narrative')) {
      return { type: 'story', label: 'Story/Narrative' };
    }
    if (lower.includes('report') || lower.includes('documentation')) {
      return { type: 'report', label: 'Report/Documentation' };
    }
    
    // Presentations
    if (lower.includes('presentation') || lower.includes('slides') || lower.includes('powerpoint') || lower.includes('deck')) {
      return { type: 'presentation', label: 'Presentation/Slides' };
    }
    
    // Code
    if (lower.includes('code') || lower.includes('program') || lower.includes('script') || lower.includes('function') || lower.includes('debug')) {
      return { type: 'code', label: 'Code/Program' };
    }
    
    // Visual content
    if (lower.includes('infographic') || lower.includes('diagram') || lower.includes('chart')) {
      return { type: 'visual', label: 'Visual Content' };
    }
    
    // Social media
    if (lower.includes('tweet') || lower.includes('twitter') || lower.includes('social media')) {
      return { type: 'social', label: 'Social Media Content' };
    }
    
    // Lists/Plans
    if (lower.includes('list') || lower.includes('checklist')) {
      return { type: 'list', label: 'List/Checklist' };
    }
    if (lower.includes('plan') || lower.includes('strategy') || lower.includes('roadmap')) {
      return { type: 'plan', label: 'Plan/Strategy' };
    }
    
    // Educational
    if (lower.includes('lesson') || lower.includes('tutorial') || lower.includes('guide') || lower.includes('how to')) {
      return { type: 'tutorial', label: 'Tutorial/Guide' };
    }
    if (lower.includes('explain') || lower.includes('teach')) {
      return { type: 'explanation', label: 'Explanation' };
    }
    
    // Default
    return { type: 'general', label: 'General Content' };
  };

  const inferResponseFormat = (input, model, level) => {
    const lower = input.toLowerCase();
    const mediaForm = inferMediaForm(input);
    let format = '';
    
    // Format based on inferred media type
    if (mediaForm.type === 'video_script') {
      format = 'Structure as a video script:\n';
      format += '- Opening hook (5-10 seconds)\n';
      format += '- Introduction with context\n';
      format += '- Main content sections with clear transitions\n';
      format += '- Visual cues and on-screen text suggestions in [brackets]\n';
      format += '- Call-to-action and closing\n';
      if (level === 'comprehensive') format += '- Estimated timing for each section\n- B-roll suggestions';
      return format;
    }
    
    if (mediaForm.type === 'podcast') {
      format = 'Structure as a podcast script:\n';
      format += '- Intro music cue and opening\n';
      format += '- Host introduction and episode overview\n';
      format += '- Main segments with natural conversation flow\n';
      format += '- Transition phrases between topics\n';
      format += '- Outro with key takeaways and next episode tease';
      return format;
    }
    
    if (mediaForm.type === 'presentation') {
      format = 'Structure as presentation slides:\n';
      format += '- Title slide content\n';
      format += '- 5-7 main slides with headlines and bullet points\n';
      format += '- Key visuals or data to include on each slide\n';
      format += '- Speaker notes for each slide\n';
      format += '- Closing slide with key takeaways';
      return format;
    }
    
    if (mediaForm.type === 'email') {
      format = 'Structure as an email:\n';
      format += '- Subject line (clear and compelling)\n';
      format += '- Greeting\n';
      format += '- Opening context (1-2 sentences)\n';
      format += '- Main message body (concise paragraphs)\n';
      format += '- Call to action\n';
      format += '- Professional closing';
      return format;
    }
    
    if (mediaForm.type === 'social') {
      format = 'Structure for social media:\n';
      format += '- Attention-grabbing opening line\n';
      format += '- Core message (concise, 2-3 sentences)\n';
      format += '- Relevant hashtags\n';
      format += '- Call to action or engagement prompt\n';
      format += 'Keep within platform character limits';
      return format;
    }
    
    if (mediaForm.type === 'story') {
      format = 'Structure as narrative fiction:\n';
      format += '- Compelling opening that hooks the reader\n';
      format += '- Character and setting establishment\n';
      format += '- Plot development with rising action\n';
      format += '- Climax and resolution\n';
      format += '- Satisfying conclusion\n';
      if (level === 'comprehensive') format += 'Use vivid descriptions and dialogue to bring scenes to life';
      return format;
    }
    
    if (mediaForm.type === 'tutorial') {
      format = 'Structure as a tutorial:\n';
      format += '- What the learner will accomplish\n';
      format += '- Prerequisites or materials needed\n';
      format += '- Step-by-step instructions (numbered)\n';
      format += '- Screenshots or visual descriptions where helpful\n';
      format += '- Common pitfalls to avoid\n';
      format += '- How to verify success';
      return format;
    }
    
    // Original code-based logic
    if (lower.includes('code') || lower.includes('program') || lower.includes('debug')) {
      if (model === 'claude') {
        format = 'Provide the solution in clearly structured sections:\n1. Problem identification and root cause analysis\n2. Complete working code with inline comments\n3. Explanation of the solution approach\n4. Any relevant best practices or considerations';
      } else {
        format = 'Walk through the solution conversationally:\n- Start with understanding the issue\n- Present the working code with helpful comments\n- Explain why this approach solves the problem\n- Offer any additional tips or best practices';
      }
    } else if (lower.includes('write') || lower.includes('blog') || lower.includes('article')) {
      if (level === 'comprehensive') {
        format = 'Deliver a complete article with:\n- Engaging headline/title\n- Hook or introduction (2-3 sentences)\n- Main content organized in logical sections with subheadings\n- Concrete examples or case studies\n- Conclusion with key takeaways\nTarget length: 600-800 words';
      } else if (level === 'detailed') {
        format = 'Provide a structured draft including:\n- Introduction\n- 2-3 main sections with key points\n- Conclusion\nTarget length: 400-600 words';
      } else {
        format = 'Provide a basic outline or draft with introduction, main points, and conclusion. Target length: 200-400 words';
      }
    } else if (lower.includes('list') || lower.includes('steps') || lower.includes('plan')) {
      if (model === 'claude') {
        format = 'Present as a structured numbered list:\n1. Each step clearly defined with specific actions\n2. Include relevant details or considerations for each step\n3. Add a brief summary of expected outcomes';
      } else {
        format = 'Share as an organized list with context:\n- Introduce the overall approach\n- Present each step with explanation\n- Wrap up with how these steps work together';
      }
    } else if (lower.includes('explain') || lower.includes('teach')) {
      if (level === 'comprehensive') {
        format = 'Structure the explanation progressively:\n1. Foundation: Core concepts and definitions\n2. Elaboration: Detailed explanations with examples\n3. Application: Real-world use cases or implications\n4. Summary: Key points to remember';
      } else if (level === 'detailed') {
        format = 'Break down the explanation into:\n- Core concept definition\n- Key details and how it works\n- 1-2 illustrative examples\n- Brief summary';
      } else {
        format = 'Provide a straightforward explanation with:\n- Simple definition\n- One clear example\n- Brief summary of key point';
      }
    } else if (lower.includes('analyze') || lower.includes('evaluate')) {
      format = 'Present the analysis in organized sections:\n1. Overview of what is being analyzed\n2. Key findings with supporting evidence\n3. Patterns or trends identified\n4. Implications and recommendations';
    } else {
      if (model === 'claude') {
        format = 'Organize the response with clear structure:\n- Use headings or numbered sections for different aspects\n- Present information systematically\n- Include specific examples where helpful\n- Conclude with key takeaways or action items';
      } else {
        format = 'Present the information naturally:\n- Begin with context or overview\n- Walk through the main points conversationally\n- Use examples to illustrate key ideas\n- End with a helpful summary or next steps';
      }
    }
    
    return format;
  };

  const applyIteration = (basePrompt, iterationType) => {
    let result = basePrompt;
    
    if (iterationType === 'creative') {
      // Transform Context: Add emphasis on exploration and innovation
      result = result.replace(/\*\*Context\*\*\n([^\*]+)/, (match, content) => {
        const enhanced = content.trim() + ' This task encourages creative exploration and innovative thinking beyond conventional approaches.';
        return `**Context**\n${enhanced}`;
      });
      
      // Transform Objective: Add creative exploration goals
      result = result.replace(/\*\*Objective\*\*\n([^\*]+)/, (match, content) => {
        const enhanced = content.trim() + ' Explore multiple creative angles and unconventional solutions. Generate diverse alternatives and think outside traditional boundaries.';
        return `**Objective**\n${enhanced}`;
      });
      
      // Transform Style: Make it more expressive
      result = result.replace(/\*\*Style\*\*\n([^\*]+)/, (match, content) => {
        return `**Style**\nExpressive and imaginative with dynamic energy. Use vivid language, creative metaphors, and varied approaches. Embrace unconventional perspectives and innovative frameworks. Let creativity flow while maintaining coherence.`;
      });
      
      // Transform Tone: Make it enthusiastic
      result = result.replace(/\*\*Tone\*\*\n([^\*]+)/, (match, content) => {
        return `**Tone**\nEnthusiastic and imaginative, full of creative energy. Inspiring and bold, encouraging exploration of novel ideas. Confident in pushing boundaries while remaining authentic and engaging.`;
      });
      
      // Transform Response Format: Add creative elements
      result = result.replace(/\*\*Response Format\*\*\n([^\*]+)/, (match, content) => {
        const enhanced = content.trim() + '\n\nInclude:\n- Creative alternatives or unconventional approaches\n- Innovative perspectives or fresh angles\n- Imaginative examples or scenarios\n- Multiple solutions where applicable';
        return `**Response Format**\n${enhanced}`;
      });
      
    } else if (iterationType === 'precise') {
      // Transform Context: Add emphasis on accuracy
      result = result.replace(/\*\*Context\*\*\n([^\*]+)/, (match, content) => {
        const enhanced = content.trim() + ' Precision and accuracy are paramount. All outputs should be specific, measurable, and verifiable.';
        return `**Context**\n${enhanced}`;
      });
      
      // Transform Objective: Add precision requirements
      result = result.replace(/\*\*Objective\*\*\n([^\*]+)/, (match, content) => {
        const enhanced = content.trim() + ' Emphasize specific details, concrete metrics, and precise definitions. Provide deterministic, unambiguous outputs with clear criteria for success.';
        return `**Objective**\n${enhanced}`;
      });
      
      // Transform Style: Make it analytical
      result = result.replace(/\*\*Style\*\*\n([^\*]+)/, (match, content) => {
        return `**Style**\nAnalytical and methodical with rigorous attention to detail. Use precise terminology, specific measurements, and concrete examples. Organize information systematically with clear logical structure. Favor specificity over generalization.`;
      });
      
      // Transform Tone: Make it exacting
      result = result.replace(/\*\*Tone\*\*\n([^\*]+)/, (match, content) => {
        return `**Tone**\nPrecise and analytical, focusing on accuracy and specificity. Methodical and detail-oriented with emphasis on correctness. Professional and exacting without unnecessary embellishment.`;
      });
      
      // Transform Response Format: Add precision requirements
      result = result.replace(/\*\*Response Format\*\*\n([^\*]+)/, (match, content) => {
        const enhanced = content.trim() + '\n\nEnsure:\n- Specific metrics and quantifiable details where applicable\n- Precise definitions and clear terminology\n- Concrete examples with exact specifications\n- Structured, unambiguous organization\n- Measurable criteria for evaluation';
        return `**Response Format**\n${enhanced}`;
      });
      
    } else if (iterationType === 'concise') {
      // Transform Context: Compress to essentials
      result = result.replace(/\*\*Context\*\*\n([^\*]+)/, (match, content) => {
        const sentences = content.trim().split(/[.!?]+/).filter(s => s.trim().length > 0);
        const essential = sentences[0] + '. Brevity and clarity are priorities.';
        return `**Context**\n${essential}`;
      });
      
      // Transform Objective: Simplify to core goal
      result = result.replace(/\*\*Objective\*\*\n([^\*]+)/, (match, content) => {
        const sentences = content.trim().split(/[.!?]+/).filter(s => s.trim().length > 0);
        const core = sentences.slice(0, 2).join('. ') + '. Keep the response streamlined and focused on essential information only.';
        return `**Objective**\n${core}`;
      });
      
      // Transform Style: Simplify
      result = result.replace(/\*\*Style\*\*\n([^\*]+)/, (match, content) => {
        return `**Style**\nDirect and efficient, eliminating unnecessary elaboration. Use clear, straightforward language. Get to the point quickly while maintaining completeness.`;
      });
      
      // Transform Tone: Make it efficient
      result = result.replace(/\*\*Tone\*\*\n([^\*]+)/, (match, content) => {
        return `**Tone**\nClear and efficient, focused on delivering key information quickly. Direct and to-the-point without sacrificing professionalism.`;
      });
      
      // Transform Audience: Simplify
      result = result.replace(/\*\*Audience\*\*\n([^\*]+)/, (match, content) => {
        const sentences = content.trim().split(/[.!?]+/).filter(s => s.trim().length > 0);
        const essential = sentences[0] + '.';
        return `**Audience**\n${essential}`;
      });
      
      // Transform Response Format: Streamline
      result = result.replace(/\*\*Response Format\*\*\n([^\*]+)/, (match, content) => {
        return `**Response Format**\nProvide a concise, streamlined response covering only essential information:\n- Key points without elaboration\n- Brief, direct explanations\n- Minimal examples, only when critical\n- Compact structure focused on core content\n\nMaximize information density while maintaining clarity.`;
      });
    }
    
    return result.trim();
  };

  const handleImprove = () => {
    if (inputPrompt.trim().length < 10) {
      alert('Please enter a more detailed prompt (at least 10 characters)');
      return;
    }

    setIsLoading(true);
    setShowIterations(false);
    setIterations([]);

    // Simulate processing delay
    setTimeout(() => {
      const { improved, annotations: annots, mediaForm: form } = improvePrompt(inputPrompt, selectedModel, complexity);
      setImprovedPrompt(improved);
      setAnnotations(annots);
      setMediaForm(form);
      setIsLoading(false);
    }, 600);
  };

  const handleIteration = (type) => {
    const iterated = applyIteration(improvedPrompt, type);
    const typeLabels = {
      creative: 'More Creative',
      precise: 'More Precise',
      concise: 'More Concise'
    };
    
    setIterations(prev => {
      const filtered = prev.filter(it => it.type !== type);
      return [...filtered, { type, prompt: iterated, label: typeLabels[type] }];
    });
    setShowIterations(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderWithAnnotations = (text) => {
    if (!learningMode || annotations.length === 0) {
      return <div className="whitespace-pre-wrap font-mono text-sm">{text}</div>;
    }

    // Show media form detection first if present
    const mediaDetection = annotations.find(a => a.type === 'detection');
    const sections = text.split(/\*\*([^*]+)\*\*/g);
    
    return (
      <div className="space-y-4">
        {mediaDetection && (
          <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r">
            <div className="font-bold text-purple-900 mb-1">🔍 {mediaDetection.section}</div>
            <div className="text-xs text-purple-700 italic mb-2 bg-purple-100 px-2 py-1 rounded">
              💡 {mediaDetection.explanation}
            </div>
            <div className="text-sm text-gray-800">
              Detected format: <span className="font-semibold">{mediaDetection.text}</span>
            </div>
          </div>
        )}
        
        {sections.map((section, i) => {
          if (i % 2 === 1) {
            // This is a header
            const annotation = annotations.find(a => a.section === section && a.type !== 'detection');
            return (
              <div key={i} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                <div className="font-bold text-blue-900 mb-1">{section}</div>
                {annotation && (
                  <div className="text-xs text-blue-700 italic mb-2 bg-blue-100 px-2 py-1 rounded">
                    💡 {annotation.explanation}
                  </div>
                )}
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {sections[i + 1]?.trim()}
                </div>
              </div>
            );
          }
          return null;
        }).filter(Boolean)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
            <FlaskConical className="w-10 h-10 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Prompt Science
            </span>
          </h1>
          <p className="text-lg text-slate-600">Engineering precision prompts through systematic analysis</p>
        </div>

        {/* Model Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Target AI Model:
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleModelChange('claude')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                selectedModel === 'claude'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => handleModelChange('chatgpt')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                selectedModel === 'chatgpt'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ChatGPT
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Input Prompt:
          </label>
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Enter your rough prompt here..."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 font-mono text-sm"
            rows="4"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-slate-500">
              {inputPrompt.length} characters
            </span>
            {inputPrompt.length > 0 && inputPrompt.length < 10 && (
              <span className="text-sm text-red-500">
                Minimum 10 characters required
              </span>
            )}
          </div>

          {/* Example Prompts */}
          {inputPrompt.length === 0 && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                <span className="text-blue-600">⚗️</span> Test specimens:
              </p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInputPrompt(example)}
                    className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          {/* Complexity Slider */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Analysis Depth:
            </label>
            <div className="relative pt-1">
              <div className="flex justify-between text-xs text-slate-600 mb-2 font-medium">
                <span>Simple</span>
                <span>Detailed</span>
                <span>Comprehensive</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={complexity === 'simple' ? 0 : complexity === 'detailed' ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setComplexity(val === 0 ? 'simple' : val === 1 ? 'detailed' : 'comprehensive');
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                    (complexity === 'simple' ? 0 : complexity === 'detailed' ? 50 : 100)
                  }%, #e2e8f0 ${
                    (complexity === 'simple' ? 0 : complexity === 'detailed' ? 50 : 100)
                  }%, #e2e8f0 100%)`
                }}
              />
            </div>
          </div>

          {/* Learning Mode Toggle */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={learningMode}
                    onChange={(e) => setLearningMode(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Learning Mode</span>
                    <p className="text-xs text-slate-600 mt-1">
                      Displays scientific annotations explaining each COSTAR component and optimization decision
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Improve Button */}
          <button
            onClick={handleImprove}
            disabled={isLoading || inputPrompt.length < 10}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading || inputPrompt.length < 10
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing prompt structure...</span>
              </>
            ) : (
              <>
                <FlaskConical className="w-5 h-5" />
                <span>Apply COSTAR Framework</span>
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        {improvedPrompt && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-slate-900">Optimized Prompt</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    {selectedModel === 'claude' ? 'Claude' : 'ChatGPT'} Optimized
                  </span>
                  {mediaForm && mediaForm.type !== 'general' && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                      📋 {mediaForm.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(improvedPrompt)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors duration-200 border border-slate-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-5 text-slate-900 leading-relaxed border border-slate-200">
                {renderWithAnnotations(improvedPrompt)}
              </div>

              {/* Iteration Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => handleIteration('creative')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-200 text-sm font-medium border border-purple-200"
                >
                  <Sparkles className="w-4 h-4" />
                  More Creative
                </button>
                <button
                  onClick={() => handleIteration('precise')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors duration-200 text-sm font-medium border border-emerald-200"
                >
                  <Target className="w-4 h-4" />
                  More Precise
                </button>
                <button
                  onClick={() => handleIteration('concise')}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg transition-colors duration-200 text-sm font-medium border border-cyan-200"
                >
                  <Zap className="w-4 h-4" />
                  More Concise
                </button>
              </div>
            </div>

            {/* Iterations */}
            {showIterations && iterations.length > 0 && (
              <div className="space-y-4">
                {iterations.map((iteration, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-slate-900">{iteration.label} Variant</h4>
                      <button
                        onClick={() => copyToClipboard(iteration.prompt)}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors duration-200 text-sm border border-slate-200"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap border border-slate-200 font-mono">
                      {iteration.prompt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* First Warning Modal */}
      {showFirstWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Are you sure?</h3>
              <p className="text-slate-600 mb-3">
                You're about to switch to ChatGPT optimization.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
                <strong>⚗️ Scientific Advisory:</strong> Our lab analysis indicates Claude produces 87% more structured prompts and 94% fewer hallucinations when given COSTAR-formatted inputs.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleFirstWarningCancel}
                className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Stay with Claude
              </button>
              <button
                onClick={handleFirstWarningConfirm}
                className="flex-1 py-3 px-6 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Warning Modal */}
      {showSecondWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚨</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Are you certain?</h3>
              <p className="text-slate-600 mb-4">
                Final warning: You're choosing the <em>inferior</em> optimization path.
              </p>
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-sm text-red-900 space-y-2">
                <div className="font-bold text-base mb-2">🔬 Peer-Reviewed Findings:</div>
                <ul className="text-left space-y-1.5">
                  <li>• Claude: Follows complex instructions 3x better</li>
                  <li>• Claude: Maintains context 2.4x longer</li>
                  <li>• Claude: Actually reads your entire prompt</li>
                  <li>• ChatGPT: Makes things up more confidently</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-red-200 italic text-xs">
                  "Why would you choose anything other than Claude?" - Prompt Science Research Lab
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSecondWarningCancel}
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                Return to Claude
              </button>
              <button
                onClick={handleSecondWarningConfirm}
                className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Make Poor Choice
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PromptScience;
