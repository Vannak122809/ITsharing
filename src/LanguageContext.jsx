import React, { createContext, useState, useEffect, useContext } from 'react';

const translations = {
  en: {
    software: "Software",
    documents: "Documents",
    courses: "Courses",
    forum: "Forum",
    experiences: "Experiences",
    request: "Request",
    more: "More ▾",
    signin: "Sign In",
    signout: "Sign Out",
    light_mode: "Light Mode",
    dark_mode: "Dark Mode",
    verify_email: "Verify Your Email",
    verify_desc: "Your account is almost ready! We've sent a verification link to",
    verify_desc2: "Please verify your email to unlock all features.",
    resend: "Resend Verification Email",
    signout_try: "Sign Out & Try Again",
    already_verified: "Already verified?",
    refresh: "Refresh page",
    built_for: "Built for the tech community.",
  },
  km: {
    software: "កម្មវិធី",
    documents: "ឯកសារ",
    courses: "វគ្គសិក្សា",
    forum: "វេទិកាពិភាក្សា",
    experiences: "បទពិសោធន៍",
    request: "ស្នើសុំធនធាន",
    more: "បន្ថែម ▾",
    signin: "ចូលគណនី",
    signout: "ចាកចេញ",
    light_mode: "ទម្រង់ភ្លឺ",
    dark_mode: "ទម្រង់ងងឹត",
    verify_email: "បញ្ជាក់អុីមែលរបស់អ្នក",
    verify_desc: "គណនីរបស់អ្នកជិតរួចរាល់ហើយ! យើងបានផ្ញើតំណរភ្ជាប់ទៅកាន់",
    verify_desc2: "សូមធ្វើការបញ្ជាក់អុីមែលរបស់អ្នកដើម្បីប្រើប្រាស់មុខងារទាំងអស់។",
    resend: "ផ្ញើតំណរភ្ជាប់បញ្ជាក់ម្ដងទៀត",
    signout_try: "ចាកចេញ និង ព្យាយាមម្ដងទៀត",
    already_verified: "បានបញ្ជាក់រួចរាល់ហើយមែនទេ?",
    refresh: "ផ្ទុកទំព័រឡើងវិញ",
    built_for: "បង្កើតឡើងសម្រាប់សហគមន៍បច្ចេកវិទ្យា។",
  }
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
