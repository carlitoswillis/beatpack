
ffmpeg -i "/Users/carlitoswillis/Downloads/test templates/testinglongername (prod. barlitxs) 123 bpm Cb Major/testinglongername (prod. barlitxs) 123 bpm Cb Major.wav" -filter_complex "[0:a]showwaves=s=1920x60:mode=line:colors=white:draw=full,format=rgba[v]" -map "[v]" -map 0:a -c:v png output.mov

ffmpeg -i input -filter_complex "[0:a]showwaves=s=1920x60:mode=line:colors=white:draw=full,format=rgba[v]" -map "[v]" -map 0:a -c:v png showwaves.mov