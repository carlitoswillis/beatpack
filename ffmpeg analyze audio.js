docker run -v "/Users/carlitoswillis/Downloads":$(pwd) -w $(pwd) jrottenberg/ffmpeg:3.2-scratch -stats -itsoffset 00:00:0.050 -i testing.mp3 -filter_complex "[0:a]aformat=channel_layouts=mono,showwaves=s=1080x120:mode=cline:r=240:colors=red,format=yuv420p[v]" -map "[v]" -map 0:a -c:v libx264 -c:a libfdk_aac -vbr 5 test.mp4 -y



docker run -v "/Users/carlitoswillis/Downloads":$(pwd) -w $(pwd) jrottenberg/ffmpeg -stats -itsoffset 00:00:0.050 -i testing.mp3 -f lavfi -i color=s=2560x1440:r=120:color=white -filter_complex "[0:a]aformat=channel_layouts=mono,showwaves=s=2560x1440:mode=cline:r=30:colors=black[v];[1:v][v]overlay=format=auto:x=(W-w)/2:y=(H-h)/2,format=yuv420p[outv]" -map "[outv]" -map 0:a -c:v libx264 -c:a libfdk_aac -vbr 5 -shortest test.mp4 -y