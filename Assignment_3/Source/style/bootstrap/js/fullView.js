var panelShown = true;

if(!panelShown)
{
    $("header").slideUp();
    $("div.p1").slideUp();
    $("div.p2").slideUp();
    $("div.p3").slideUp();
    $("div.p4").slideUp();
    $("div.p5").slideUp();
    $("div.p6").slideUp();
}

else
{
    $("header").slideDown();
    $("div.p1").slideDown();
    $("div.p2").slideDown();
    $("div.p3").slideDown();
    $("div.p4").slideDown();
    $("div.p5").slideDown();
    $("div.p6").slideDown();
}

$(document).keydown(function(e)
{
    if(e.keyCode == 27)
    {
        if(!panelShown)
        {
            $("header").slideDown();
            $("div.p1").slideDown();
            $("div.p2").slideDown();
            $("div.p3").slideDown();
            $("div.p4").slideDown();
            $("div.p5").slideDown();
            $("div.p6").slideDown();
            panelShown = true;

            toastr.clear()
        }
    }
});

$(".expand").click(function()
{
    if(panelShown)
    {
        $("header").slideUp();
        $("div.p1").slideUp();
        $("div.p2").slideUp();
        $("div.p3").slideUp();
        $("div.p4").slideUp();
        $("div.p5").slideUp();
        $("div.p6").slideUp();
        panelShown = false;

        toastr.info("You can press 'ESC' again to go back");
    }
});
