I want to make voice controller for my website. I already developed voice controller backend and other AI backends. User can controll whole website using voice.

I want to implement VoiceButton.jsx file below requirement.

* When user press button system go to always listening mode. If user press again system go to normal mode(Disable listening mode).
* When user say somthing, I want catch it using this function handleVoiceText(text) in App.jsx file. I want full speacking sentense or fully saying sentenses, Not word by word or letters. (Ex: Think I saying "Hello. I want to go go about page. Can you go it.", That whole sensetese must be catch using above function. Next time I say "Now I want to go home page.", this time I want to catch only this time saying sentense).
* I want to preview What is I saying and What is system status(Give me way to change system status in App.jsx. not use hardcodes system status or other default status. I implement my own status in App.jsx).
* Consider moden, best UI and UX.

Do not use or create separete file. Please think and implement best and functional voice button.

* Voice Button implemented in App.jsx like below

1.
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<LayoutWithHeader />} />
      </Routes>
    </BrowserRouter>

2. 
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-reminders" element={<MyReminders />} />
      </Routes>
      <VoiceButton />
    </>